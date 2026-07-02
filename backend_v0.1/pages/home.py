import logging

from fastapi import APIRouter, Depends, status

from app.auth import verify_user_token
from app.supabase_client import get_supabase_admin

home_router = APIRouter(prefix="/api/v1", tags=["Home"])
logger = logging.getLogger("Monicare.home")


@home_router.get("/dashboard", status_code=status.HTTP_200_OK)
async def home(current_user=Depends(verify_user_token)):
    current_user_id = getattr(current_user, "id", None)
    logger.info("User %s accessed the home endpoint.", current_user_id)

    if not current_user_id:
        return {
            "status": "error",
            "message": "Missing user identity.",
        }

    supabase_admin = get_supabase_admin()

    try:
        profile_response = (
            supabase_admin.table("profiles")
            .select("first_name,last_name,nomba_bank_name,nomba_virtual_account")
            .eq("id", current_user_id)
            .maybe_single()
            .execute()
        )
        profile = profile_response.data or {}
    except Exception as err:
        logger.error("Profile lookup failed for /home: %s", err, exc_info=True)
        profile = {}

    first_name = (profile.get("first_name") or getattr(current_user, "first_name", "") or "").strip()
    last_name = (profile.get("last_name") or getattr(current_user, "last_name", "") or "").strip()
    account_name = " ".join(part for part in [first_name, last_name] if part).strip()
    bank_name = profile.get("nomba_bank_name") or "UNKNOWN"
    account_number = profile.get("nomba_virtual_account") or "UNKNOWN"

    return {
        "status": "success",
        "message": "Home profile loaded successfully.",
        "data": {
            "first_name": first_name,
            "last_name": last_name,
            "account_name": account_name,
            "bank_name": bank_name,
            "account_number": account_number,
        },
    }
