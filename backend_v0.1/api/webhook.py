import hashlib
import hmac
import json
import logging
import os
from typing import Any, Optional

from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.supabase_client import get_supabase_admin

logger = logging.getLogger("Monicare.webhook")
router = APIRouter(prefix="/api/v1/webhooks", tags=["Webhooks"])

# Load the Nomba webhook secret from environment variables
NOMBA_WEBHOOK_SECRET = os.environ.get("NOMBA_WEBHOOK_SECRET", "")

if not NOMBA_WEBHOOK_SECRET:
    logger.warning("NOMBA_WEBHOOK_SECRET is not set. Webhook verification will fail.")

# --- Pydantic Models for Nomba Webhook Payload ---
# These models ensure the incoming data from Nomba has the structure we expect.

class NombaTransactionData(BaseModel):
    """Represents the core transaction details within the webhook payload."""
    transaction_id: str = Field(alias="transactionId")
    amount: float
    status: str
    account_reference: str = Field(alias="accountReference")
    payment_reference: str = Field(alias="paymentReference")

class NombaWebhookPayload(BaseModel):
    """Represents the entire webhook payload sent by Nomba."""
    event: str
    data: NombaTransactionData


async def verify_nomba_signature(request: Request, signature: str) -> bool:
    """
    Verifies the incoming request signature against our secret.
    This is a critical security step to ensure the request is from Nomba.
    """
    if not NOMBA_WEBHOOK_SECRET:
        return False

    body = await request.body()
    
    # Nomba uses HMAC-SHA512 for its signature.
    computed_hash = hmac.new(
        key=NOMBA_WEBHOOK_SECRET.encode("utf-8"),
        msg=body,
        digestmod=hashlib.sha512,
    ).hexdigest()

    return hmac.compare_digest(computed_hash, signature)


@router.post("/nomba", status_code=status.HTTP_200_OK)
async def handle_nomba_webhook(
    request: Request,
    x_nomba_signature: Optional[str] = Header(None),
) -> dict[str, Any]:
    """
    Handles incoming webhook events from Nomba for wallet funding.
    """
    if not x_nomba_signature:
        logger.warning("Received webhook without a signature.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Signature missing.")

    # 1. Verify the signature
    is_valid = await verify_nomba_signature(request, x_nomba_signature)
    if not is_valid:
        logger.error("Received webhook with an invalid signature.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature.")

    try:
        payload_data = await request.json()
        payload = NombaWebhookPayload.model_validate(payload_data)
    except (json.JSONDecodeError, Exception) as e:
        logger.error("Failed to parse webhook payload: %s", e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload format.")

    # 2. Process only successful payment events
    if payload.event != "payment.success" or payload.data.status.upper() != "SUCCESS":
        logger.info("Skipping non-successful payment event: %s", payload.event)
        return {"status": "success", "message": "Event received but not processed."}

    supabase_admin = get_supabase_admin()
    transaction_ref = payload.data.payment_reference

    # 3. Idempotency Check: Ensure we haven't processed this transaction before
    try:
        existing_txn_res = (
            supabase_admin.table("wallet_transactions")
            .select("transaction_id", count="exact")
            .eq("nomba_transaction_ref", transaction_ref)
            .execute()
        )
        if existing_txn_res.count > 0:
            logger.info("Duplicate webhook event received for transaction %s. Acknowledging.", transaction_ref)
            return {"status": "success", "message": "Duplicate event. Already processed."}
    except Exception as err:
        logger.error("Database error during idempotency check for txn %s: %s", transaction_ref, err)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database check failed.")

    # 4. Find the user and update their wallet
    account_ref = payload.data.account_reference
    amount_paid = payload.data.amount

    try:
        # Find the user profile using the unique account reference
        profile_res = (
            supabase_admin.table("profiles")
            .select("id, wallet_balance")
            .eq("nomba_account_ref", account_ref)
            .single()
            .execute()
        )
        profile = profile_res.data

        if not profile:
            logger.error("Received valid webhook for an unknown account reference: %s", account_ref)
            return {"status": "error", "message": "Account reference not found."}

        # This block should ideally be an atomic transaction (e.g., an RPC call)
        # Step 4a: Update the user's wallet balance
        current_balance = float(profile.get("wallet_balance", 0.0) or 0.0)
        new_balance = current_balance + amount_paid
        supabase_admin.table("profiles").update({"wallet_balance": new_balance}).eq("id", profile["id"]).execute()

        # Step 4b: Log the transaction to prevent duplicates
        supabase_admin.table("wallet_transactions").insert({
            "user_id": profile["id"],
            "amount": amount_paid,
            "reference": f"Wallet funding via Nomba: {transaction_ref}",
            "nomba_transaction_ref": transaction_ref,
        }).execute()

        logger.info(
            "Successfully processed wallet funding for user %s. Amount: %s, Ref: %s",
            profile["id"], amount_paid, transaction_ref
        )

    except Exception as err:
        logger.critical("CRITICAL: Failed to process wallet funding for ref %s after validation: %s", transaction_ref, err)
        # Return a 500 error so Nomba will retry sending the webhook
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update wallet.")

    return {"status": "success", "message": "Webhook processed successfully."}