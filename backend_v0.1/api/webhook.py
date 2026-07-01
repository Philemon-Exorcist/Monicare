import hmac
import hashlib
import logging
from fastapi import APIRouter, Request, Header, HTTPException, status
from models.nomba_schema import settings
from models.webhook_schema import NombaWebhookPayload
from app.supabase_client import get_supabase_admin

logger = logging.getLogger("Monicare.webhooks")
router = APIRouter(prefix="/api/monicare/", tags=["Webhooks"])

# Ensure your secret is encoded as bytes for HMAC encryption
NOMBA_SECRET = bytes(settings.nomba_webhook_secret, "utf-8")

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def receive_nomba_payment_notification(
    request: Request, 
    x_nomba_signature: str = Header(None) # Nomba passes its cryptographic signature here
):
    # ─── SECURITY BLOCK 1: CRYPTOGRAPHIC HANDSHAKE SIGNATURE CHECKS ───
    if not x_nomba_signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing signature header.")

    raw_body = await request.body()
    
    # Compute the expected hash using Python's native hmac and hashlib
    computed_signature = hmac.new(NOMBA_SECRET, raw_body, hashlib.sha256).hexdigest()
    
    # Enforce secure timing-attack resistant comparison
    if not hmac.compare_digest(computed_signature, x_nomba_signature):
        logger.warning("Hacking attempt blocked: Webhook signature mismatch.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid verification source.")

    # ─── PAYLOAD DECODING LAYER ───
    payload = await request.json()
    
    # Skip early if it's a test event or a different event trigger
    if payload.get("event") != "virtual_account.payment_received":
        return {"status": "ignored", "message": "Event type not processed by wallet engine."}

    # Validate structural payload criteria against Pydantic schema
    validated_payload = NombaWebhookPayload.model_validate(payload)
    payment_info = validated_payload.data
    
    # Extract structural references
    network_ref = payment_info.order_reference
    tracking_tag = payment_info.account_reference # e.g., "USER_REF_uuid"
    amount_deposited = payment_info.amount

    # Extract user's internal Supabase UUID straight from our tracking tag
    user_uuid = tracking_tag.replace("USER_REF_", "")

    # ─── SECURITY BLOCK 2: THE IDEMPOTENCY ID REPEAT GUARD ───
    # Spin up our clean administrative thread to interact with RLS-protected tables
    supabase_admin = get_supabase_admin()
    
    existing_txn = supabase_admin.table("wallet_transactions")\
        .select("id").eq("nomba_transaction_ref", network_ref).execute()
        
    if existing_txn.data:
        # We already processed this payment receipt! Exit cleanly so we don't double-credit
        return {"status": "duplicate", "message": "Transaction receipt already fully settled."}

    # ─── STEP 3: EXECUTE TRANSACTION AND BALANCES UPDATE ───
    try:
        # A. Fetch current user balance ledger
        user_profile = supabase_admin.table("profiles").select("wallet_balance").eq("id", user_uuid).single().execute()
        current_balance = float(user_profile.data["wallet_balance"])
        
        # Calculate new total wallet balance
        new_balance = current_balance + amount_deposited

        # B. Push clean mathematical update directly to Supabase profiles
        supabase_admin.table("profiles").update({"wallet_balance": new_balance}).eq("id", user_uuid).execute()

        # C. Burn an unchangeable transaction receipt item row into the history logs
        supabase_admin.table("wallet_transactions").insert({
            "user_id": user_uuid,
            "amount": amount_deposited,
            "type": "TOPUP",
            "status": "SUCCESS",
            "nomba_transaction_ref": network_ref
        }).execute()

        logger.info(f"Wallet deposit success: User {user_uuid} credited ₦{amount_deposited}")
        return {"status": "success", "message": "Wallet ledger balance updated successfully."}

    except Exception as db_err:
        logger.critical(f"Critical database transaction save write error: {db_err}")
        # Log it as failed inside your transaction tables so you don't lose track of it
        try:
            supabase_admin.table("wallet_transactions").insert({
                "user_id": user_uuid,
                "amount": amount_deposited,
                "type": "TOPUP",
                "status": "FAILED",
                "nomba_transaction_ref": network_ref
            }).execute()
        except:
            pass
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal ledger sync crash.")
