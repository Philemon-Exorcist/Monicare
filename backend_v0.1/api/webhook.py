import hashlib
import hmac
import json
import logging
import base64
import os
from typing import Any, Optional

from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import ValidationError

from app.supabase_client import get_supabase_admin
from models.webhook_schema import NombaWebhookPayload

logger = logging.getLogger("Monicare.webhook")
router = APIRouter(prefix="/api/monicare", tags=["Webhooks"])

# Load the Nomba webhook secret from environment variables
NOMBA_WEBHOOK_SECRET = os.environ.get("NOMBA_WEBHOOK_SECRET", "")

if not NOMBA_WEBHOOK_SECRET:
    logger.warning("NOMBA_WEBHOOK_SECRET is not set. Webhook verification will fail.")

async def verify_nomba_signature(request: Request, signature: str, timestamp: str) -> bool:
    """
    Verifies the incoming request signature by reconstructing the signature string
    as per Nomba's documentation.
    This is a critical security step to ensure the request is from Nomba.
    """
    if not all([NOMBA_WEBHOOK_SECRET, signature, timestamp]):
        return False

    try:
        body_bytes = await request.body()
        payload = json.loads(body_bytes)

        # Reconstruct the signature string as per Nomba documentation
        # The string is: event_type:requestId:userId:walletId:transactionId:transactionType:transactionTime:transactionResponseCode:timestamp
        data = payload.get("data", {})
        merchant = data.get("merchant", {})
        transaction = data.get("transaction", {})

        event_type = payload.get("event_type", "")
        request_id = payload.get("requestId", "")
        user_id = merchant.get("userId", "")
        wallet_id = merchant.get("walletId", "")
        transaction_id = transaction.get("transactionId", "")
        transaction_type = transaction.get("type", "")
        transaction_time = transaction.get("time", "")
        response_code = transaction.get("responseCode", "")

        hashing_payload = f"{event_type}:{request_id}:{user_id}:{wallet_id}:{transaction_id}:{transaction_type}:{transaction_time}:{response_code}:{timestamp}"

        digest = hmac.new(NOMBA_WEBHOOK_SECRET.encode(), hashing_payload.encode(), hashlib.sha256).digest()
        computed_signature = base64.b64encode(digest).decode()

        return hmac.compare_digest(computed_signature, signature)
    except Exception:
        return False


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def handle_nomba_webhook(
    request: Request,
    nomba_signature: Optional[str] = Header(None),
    nomba_timestamp: Optional[str] = Header(None),
) -> dict[str, Any]:
    """
    Handles incoming webhook events from Nomba for wallet funding.
    """
    if not nomba_signature:
        logger.warning("Received webhook without a signature.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Signature missing.")

    # 1. Verify the signature
    is_valid = await verify_nomba_signature(request, nomba_signature, nomba_timestamp)
    if not is_valid:
        logger.error("Received webhook with an invalid signature.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature.")

    try:
        payload_data = await request.json()
        payload = NombaWebhookPayload.model_validate(payload_data)
    except (json.JSONDecodeError, ValidationError, Exception) as e:
        logger.error("Failed to parse webhook payload: %s", e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload format.")

    # 2. Process only successful payment events
    transaction = payload.data.transaction
    merchant = payload.data.merchant

    event_name = payload.event_type
    transaction_status = (transaction.type or transaction.response_code or "").upper()
    transaction_amount = transaction.transaction_amount
    account_ref = (
        transaction.account_reference
        or transaction.alias_account_reference
        or (merchant.wallet_id if merchant else None)
    )
    transaction_ref = (
        transaction.payment_reference
        or transaction.transaction_id
        or transaction.session_id
        or account_ref
    )

    if event_name not in {"payment.success", "payment_succeeded", "payment_completed"} and transaction_status not in {"SUCCESS", "00"}:
        logger.info("Skipping non-successful payment event: %s", event_name)
        return {"status": "success", "message": "Event received but not processed."}

    supabase_admin = get_supabase_admin()

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
    amount_paid = transaction_amount

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
            "type": "TOPUP",
            "status": "SUCCESS",
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
