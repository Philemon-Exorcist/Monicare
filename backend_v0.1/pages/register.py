from fastapi import HTTPException, status, APIRouter
import logging
from app.supabase_client import get_supabase_admin
from models.registration_schema import UserAuthCredentials, UserSignUpPayload
from integrations.virtual_account import create_virtual_account

logger = logging.getLogger("Monicare Logger")

router = APIRouter(prefix="/api/v1", tags=["Authentication"])

supabase_admin = None


def get_admin_client():
    global supabase_admin
    if supabase_admin is None:
        supabase_admin = get_supabase_admin()
    return supabase_admin


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup_and_create_account(payload: UserSignUpPayload):
    """
    Registers credentials inside Supabase Auth, creates an initial profile row,
    and triggers virtual-account provisioning.
    """
    admin_client = get_admin_client()

    try:
        auth_response = admin_client.auth.sign_up({
            "email": str(payload.email),
            "password": payload.password,
            "options": {
                "data": {
                    "first_name": payload.first_name,
                    "last_name": payload.last_name,
                }
            },
        })

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Authentication signup failed.")

        generated_uuid = auth_response.user.id
        tracking_reference = f"USER_REF_{generated_uuid}"

        initial_profile = {
            "id": generated_uuid,
            "first_name": payload.first_name,
            "middle_name": payload.middle_name,
            "last_name": payload.last_name,
            "email": str(payload.email),
            "phone_no": payload.phone_no,
            "wallet_balance": 0.00,
            "nomba_account_ref": tracking_reference,
            "nomba_virtual_account": "PENDING_PROVISIONING",
        }

        admin_client.table("profiles").insert(initial_profile).execute()

    except Exception as auth_err:
        logger.error(f"Sign up registration crash: {auth_err}")
        raise HTTPException(status_code=400, detail=f"Registration aborted: {str(auth_err)}")

    try:
        bank_node = await create_virtual_account(
            user_uuid=generated_uuid,
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=str(payload.email),
            middle_name=payload.middle_name or "",
        )
    except Exception as e:
        logger.error(f"Failed to create virtual account: {e}")
        bank_node = {
            "success": False,
            "account_number": "FAILED_VA_PROVISIONING",
            "bank_name": "UNKNOWN",
            "account_ref": tracking_reference,
        }

    try:
        admin_client.table("profiles").update({
            "nomba_virtual_account": bank_node.get("account_number", "FAILED_VA_PROVISIONING"),
            "nomba_bank_name": bank_node.get("bank_name", "UNKNOWN"),
            "identity_status": "VERIFIED",
        }).eq("id", generated_uuid).execute()

        return {"status": "completed", "account": bank_node.get("account_number")}
    except Exception as e:
        logger.error(f"Failed to insert db record: {e}")
        raise HTTPException(status_code=500, detail="Registration completed but profile update failed.")


@router.post("/login", status_code=status.HTTP_200_OK)
async def user_login(payload: UserAuthCredentials):
    """
    Verifies phone/password inputs against Supabase and returns an access token.
    """
    admin_client = get_admin_client()

    try:
        session_auth = admin_client.auth.sign_in_with_password({
            "phone_no": payload.phone_no,
            "password": payload.password,
        })

        access_token = session_auth.session.access_token
        refresh_token = session_auth.session.refresh_token
        user_uuid = session_auth.user.id

        logger.info(f"User {user_uuid} successfully validated session access.")

        return {
            "status": "success",
            "message": "User session authenticated completely.",
            "data": {
                "user_id": user_uuid,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
            },
        }

    except Exception as auth_fail_error:
        logger.warning(f"Failed authentication login attempt for {payload.phone_no}: {auth_fail_error}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password parameters supplied.",
        )
