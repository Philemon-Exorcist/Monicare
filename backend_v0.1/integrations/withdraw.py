import hashlib
import logging
import time

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import verify_user_token
from app.supabase_client import get_supabase_admin
from integrations.idempotent_payout import generate_deterministic_payout_ref
from integrations.nomba_client import NombaAPIClient
from models.nomba_schema import NombaTransferRequest
from models.payout_schema import BankLookupRequest, WithdrawalVerificationRequest

logger = logging.getLogger("Monicare.withdrawals")

router = APIRouter(prefix="/api/v1/withdrawals", tags=["Withdrawals & Settlements"])
nomba_client = NombaAPIClient()


@router.post("/verify-and-proceed", status_code=status.HTTP_200_OK)
async def verify_withdrawal_pipeline_state(
    payload: WithdrawalVerificationRequest,
    current_user=Depends(verify_user_token),
):
    """
    Validate PIN and wallet balance, resolve the recipient bank details,
    then execute the payout through Nomba.
    """
    supabase_admin = get_supabase_admin()
    user_uuid = str(getattr(current_user, "id", None))
    if not user_uuid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    profile_response = (
        supabase_admin.table("profiles")
        .select("wallet_balance, is_pin_configured, transaction_pin_hash")
        .eq("id", user_uuid)
        .single()
        .execute()
    )
    if not profile_response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile records not found.")

    profile_data = profile_response.data
    current_balance = float(profile_data.get("wallet_balance", 0.0) or 0.0)
    is_pin_set = bool(profile_data.get("is_pin_configured", False))
    pin_hash = profile_data.get("transaction_pin_hash")

    if not is_pin_set or not pin_hash:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must configure a transaction PIN before making a withdrawal.",
        )

    if not payload.transaction_pin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction PIN is required.",
        )

    provided_pin_hash = hashlib.sha256(payload.transaction_pin.encode("utf-8")).hexdigest()
    if provided_pin_hash != pin_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect transaction PIN.")

    payout_amount = float(payload.amount)
    if current_balance < payout_amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient wallet balance.")

    unique_payout_ref = generate_deterministic_payout_ref(
        user_uuid,
        "MANUAL_WITHDRAW",
        int(time.time()),
    )

    try:
        bank_lookup = await nomba_client.lookup_bank_account_details(
            BankLookupRequest(
                accountNumber=payload.account_number,
                bankCode=payload.bank_code,
            )
        )

        supabase_admin.table("profiles").update({
            "linked_bank_code": payload.bank_code,
            "linked_account_number": payload.account_number,
            "linked_account_name": bank_lookup.get("account_name"),
        }).eq("id", user_uuid).execute()

        supabase_admin.table("wallet_transactions").insert({
            "user_id": user_uuid,
            "amount": payout_amount,
            "type": "WITHDRAWAL",
            "status": "PENDING",
            "nomba_transaction_ref": unique_payout_ref,
        }).execute()
    except Exception as err:
        logger.error("Unable to create withdrawal lock for %s: %s", user_uuid, err, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to prepare withdrawal request.",
        )

    new_balance = current_balance - payout_amount
    supabase_admin.table("profiles").update({"wallet_balance": new_balance}).eq("id", user_uuid).execute()

    transfer_payload = NombaTransferRequest(
        payoutRef=unique_payout_ref,
        amount=payout_amount,
        bankCode=payload.bank_code,
        accountNumber=payload.account_number,
        narration="Monicare Wallet Cashout withdrawal",
    )

    try:
        payout_response = await nomba_client.execute_external_bank_payout(transfer_payload)
        supabase_admin.table("wallet_transactions").update({"status": "SUCCESS"}).eq(
            "nomba_transaction_ref", unique_payout_ref
        ).execute()

        return {
            "status": "success",
            "message": f"Successfully processed transfer of ₦{payout_amount:,.2f} to your bank account.",
            "data": {
                "new_balance": new_balance,
                "payout_reference": unique_payout_ref,
                "network_response": payout_response,
            },
        }
    except Exception as api_err:
        reverted_balance = new_balance + payout_amount
        supabase_admin.table("profiles").update({"wallet_balance": reverted_balance}).eq("id", user_uuid).execute()
        supabase_admin.table("wallet_transactions").update({"status": "FAILED"}).eq(
            "nomba_transaction_ref", unique_payout_ref
        ).execute()

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Outbound bank processor connection error: {api_err}",
        )


class PinSetupPayload(BaseModel):
    transaction_pin: str = Field(..., min_length=4, max_length=4, alias="transactionPin")

    model_config = {"populate_by_name": True}


@router.post("/set-transaction-pin", status_code=status.HTTP_201_CREATED)
async def configure_user_transaction_pin(
    payload: PinSetupPayload,
    current_user=Depends(verify_user_token),
):
    """Allows users to register their transaction verification PIN."""
    supabase_admin = get_supabase_admin()
    user_uuid = str(getattr(current_user, "id", None))

    pin_hash = hashlib.sha256(payload.transaction_pin.encode("utf-8")).hexdigest()

    try:
        supabase_admin.table("profiles").update({
            "transaction_pin_hash": pin_hash,
            "is_pin_configured": True,
        }).eq("id", user_uuid).execute()

        return {"status": "success", "message": "Transaction secure PIN configured completely."}
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed updating security keys: {err}",
        )
