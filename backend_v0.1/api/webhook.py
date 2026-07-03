import hmac
import hashlib
import logging
import re

from fastapi import APIRouter, Request, Header, HTTPException, status, BackgroundTasks
from pydantic import ValidationError

from app.supabase_client import get_supabase_admin
from models.nomba_schema import settings
from models.webhook_schema import NombaWebhookPayload

logger = logging.getLogger("Monicare.webhooks")
router = APIRouter(prefix="/api/monicare", tags=["Webhooks"])

NOMBA_WEBHOOK_SECRET = getattr(settings, "NOMBA_WEBHOOK_SECRET", None)


def _get_webhook_secret() -> bytes:
    if not NOMBA_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="NOMBA_WEBHOOK_SECRET is not configured.",
        )
    return bytes(NOMBA_WEBHOOK_SECRET, "utf-8")


def _get_webhook_signature(
    nomba_signature: str | None,
    x_nomba_signature: str | None,
    x_signature: str | None,
) -> str | None:
    return nomba_signature or x_nomba_signature or x_signature


def _verify_nomba_signature(raw_body: bytes, signature: str) -> None:
    nomba_secret = _get_webhook_secret()
    computed_signature = hmac.new(nomba_secret, raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(computed_signature, signature):
        logger.warning("Webhook signature mismatch. expected=%s incoming=%s", computed_signature, signature)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature.",
        )


def _extract_user_uuid(account_reference: str) -> str:
    if not isinstance(account_reference, str):
        raise ValueError("Account reference must be a string.")

    match = re.match(r"^USER_REF_([0-9a-fA-F-]{36})$", account_reference)
    if not match:
        raise ValueError("Invalid account reference format.")

    return match.group(1)


async def _process_payment_event(user_uuid: str, amount: float, network_ref: str) -> None:
    supabase_admin = get_supabase_admin()

    existing_txn = (
        supabase_admin.table("wallet_transactions")
        .select("id")
        .eq("nomba_transaction_ref", network_ref)
        .execute()
    )

    if existing_txn.data:
        logger.info("Duplicate webhook transaction ignored: %s", network_ref)
        return

    profile_response = (
        supabase_admin.table("profiles")
        .select("wallet_balance")
        .eq("id", user_uuid)
        .single()
        .execute()
    )

    if not profile_response.data:
        logger.error("Webhook user profile not found: %s", user_uuid)
        try:
            supabase_admin.table("wallet_transactions").insert({
                "user_id": user_uuid,
                "amount": amount,
                "type": "TOPUP",
                "status": "FAILED",
                "nomba_transaction_ref": network_ref,
            }).execute()
        except Exception:
            pass
        return

    current_balance = float(profile_response.data.get("wallet_balance", 0.0) or 0.0)
    new_balance = current_balance + amount

    supabase_admin.table("profiles").update({"wallet_balance": new_balance}).eq("id", user_uuid).execute()

    supabase_admin.table("wallet_transactions").insert({
        "user_id": user_uuid,
        "amount": amount,
        "type": "TOPUP",
        "status": "SUCCESS",
        "nomba_transaction_ref": network_ref,
    }).execute()

    logger.info("Processed webhook payment: user=%s amount=%s ref=%s", user_uuid, amount, network_ref)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def receive_nomba_payment_notification(
    request: Request,
    background_tasks: BackgroundTasks,
    nomba_signature: str | None = Header(None, alias="nomba-signature"),
    x_nomba_signature: str | None = Header(None, alias="x-nomba-signature"),
    x_signature: str | None = Header(None, alias="x-signature"),
):
    raw_body = await request.body()
    signature = _get_webhook_signature(nomba_signature, x_nomba_signature, x_signature)

    if not signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing webhook signature header.",
        )

    _verify_nomba_signature(raw_body, signature)

    try:
        payload = await request.json()
    except ValueError as exc:
        logger.error("Invalid webhook JSON body: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook JSON payload.")

    if payload.get("event") != "virtual_account.payment_received":
        logger.info("Ignoring unsupported webhook event type: %s", payload.get("event"))
        return {"status": "ignored", "message": "Event type not processed."}

    try:
        validated_payload = NombaWebhookPayload.model_validate(payload)
    except ValidationError as exc:
        logger.error("Webhook schema validation failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed webhook payload.")

    payment_info = validated_payload.data

    try:
        user_uuid = _extract_user_uuid(payment_info.account_reference)
    except ValueError as exc:
        logger.error("Invalid account reference: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    background_tasks.add_task(
        _process_payment_event,
        user_uuid=user_uuid,
        amount=float(payment_info.amount),
        network_ref=payment_info.order_reference,
    )

    return {"status": "acknowledged", "message": "Webhook received."}
