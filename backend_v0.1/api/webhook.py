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








import hmac
import hashlib
import logging
from fastapi import APIRouter, Request, Header, HTTPException, status, BackgroundTasks
from models.nomba_schema import settings
from models.webhook_schema import NombaWebhookPayload
from app.supabase_client import get_supabase_admin

logger = logging.getLogger("Monicare.webhooks")
router = APIRouter(prefix="/api/monicare", tags=["Webhooks"])

# Encode secret safely from environment options
NOMBA_SECRET = bytes(settings.NOMBA_WEBHOOK_SECRET, "utf-8")


async def process_wallet_ledger_update(user_uuid: str, amount_deposited: float, network_ref: str):
    """
    Asynchronous worker that safely performs database operations
    outside Nomba's critical timeout window.
    """
    supabase_admin = get_supabase_admin()
    
    # Idempotency checks to prevent double crediting
    existing_txn = supabase_admin.table("wallet_transactions")\
        .select("id").eq("nomba_transaction_ref", network_ref).execute()
        
    if existing_txn.data:
        logger.info(f"Duplicate transaction ignored: {network_ref}")
        return

    try:
        # A. Pull existing balance fields safely
        user_profile = supabase_admin.table("profiles").select("wallet_balance").eq("id", user_uuid).single().execute()
        current_balance = float(user_profile.data.get("wallet_balance", 0.0))
        
        new_balance = current_balance + amount_deposited

        # B. Atomically apply financial updates
        supabase_admin.table("profiles").update({"wallet_balance": new_balance}).eq("id", user_uuid).execute()

        # C. Write transactional ledger row
        supabase_admin.table("wallet_transactions").insert({
            "user_id": user_uuid,
            "amount": amount_deposited,
            "type": "TOPUP",
            "status": "SUCCESS",
            "nomba_transaction_ref": network_ref
        }).execute()

        logger.info(f"Successfully processed deposit: User {user_uuid} credited ₦{amount_deposited}")

    except Exception as db_err:
        logger.critical(f"Critical database transaction save write error: {db_err}")
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


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def receive_nomba_payment_notification(
    request: Request, 
    background_tasks: BackgroundTasks,
    nomba_signature: str = Header(None, alias="nomba-signature")  # FIX: Correct official header target key
):
    # ─── SECURITY BLOCK 1: CRYPTOGRAPHIC HANDSHAKE ───
    if not nomba_signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing signature header.")

    raw_body = await request.body()
    
    # Compute the expected hash using Python's native hmac and hashlib
    computed_signature = hmac.new(NOMBA_SECRET, raw_body, hashlib.sha256).hexdigest()
    
    # Enforce secure timing-attack resistant comparison
    if not hmac.compare_digest(computed_signature, nomba_signature):
        logger.warning("Hacking attempt blocked: Webhook signature mismatch.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid verification source.")

    # ─── PAYLOAD DECODING LAYER ───
    payload = await request.json()
    
    # Skip early if it's a test event or a different event trigger
    if payload.get("event") != "virtual_account.payment_received":
        return {"status": "ignored", "message": "Event type not processed by wallet engine."}

    try:
        # Validate structural payload criteria against Pydantic schema
        validated_payload = NombaWebhookPayload.model_validate(payload)
        payment_info = validated_payload.data
        
        network_ref = payment_info.order_reference
        tracking_tag = payment_info.account_reference 
        amount_deposited = float(payment_info.amount)

        # Extract user's internal Supabase UUID straight from our tracking tag
        user_uuid = tracking_tag.replace("USER_REF_", "")

        # FIX 2: Offload long running database sync calls straight to BackgroundTasks
        background_tasks.add_task(
            process_wallet_ledger_update,
            user_uuid=user_uuid,
            amount_deposited=amount_deposited,
            network_ref=network_ref
        )

        # Return an immediate 200 OK acknowledgment response to halt Nomba's retry engines
        return {"status": "acknowledged", "message": "Webhook received successfully."}

    except Exception as parse_err:
        logger.error(f"Failed parsing incoming payload schema structure: {parse_err}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed payload layout.")
