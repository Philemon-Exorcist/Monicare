from fastapi import HTTPException, status, APIRouter
import logging
from app.supabase_client import get_supabase_admin
from models.registration_schema import UserAuthCredentials, UserSignUpPayload, UserLoginCredentials
from integrations.virtual_account import create_virtual_account
from models.nomba_schema import NombaVirtualAccountRequest

logger = logging.getLogger("Monicare Logger")

router = APIRouter(prefix="/api/v1", tags=["Authentication"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup_and_create_account(payload: UserSignUpPayload):
    """
    1. Robustly checks for pre-existing phone or email in public profiles
    2. Registers credentials inside Supabase Auth using Admin API (Bypasses verification delay)
    3. Inserts initial lock profile row into our profiles table
    4. Triggers Nomba to provision a real virtual account wallet
    """
    supabase_admin = get_supabase_admin()

    # 1. BULLETPROOF PRE-CHECK: Check both email and phone number
    try:
        existing_profile = supabase_admin.table("profiles") \
            .select("email", "phone_no") \
            .or_(f"email.eq.{payload.email},phone_no.eq.{payload.phone_no}") \
            .execute()

        if existing_profile.data:
            found_email = any(row["email"] == payload.email for row in existing_profile.data)
            if found_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email address already exists on Akawo."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this phone number already exists on Akawo."
                )
    except HTTPException:
        raise
    except Exception as check_err:
        logger.error(f"Database pre-check error: {check_err}")
        raise HTTPException(status_code=500, detail="Internal server integrity check failed.")

    # 2. CREATE IDENTITY: Admin API creates and instantly commits the user row
    try:
        # NOTE: auth.admin.create_user returns the user object directly, not wrapped in an AuthResponse
        user_record = supabase_admin.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,  # <--- Instantly activates user record in auth.users
            "phone_confirm": True, 
            "user_metadata": {
                "first_name": payload.first_name,
                "last_name": payload.last_name,
                "phone_no": payload.phone_no # Helpful metadata sync
            }
        })

        created_user = getattr(user_record, "user", None) or user_record
        generated_uuid = getattr(created_user, "id", None)
        if not generated_uuid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authentication signup succeeded, but no user id was returned from Supabase."
            )

        tracking_reference = f"USER_REF_{generated_uuid}"

    except Exception as auth_err:
        logger.error(f"Supabase Auth signup failure: {auth_err}")
        raise HTTPException(status_code=400, detail=f"Authentication gate rejected: {str(auth_err)}")

    # 3. CONVERT DATE OF BIRTH
    dob_value = payload.dob
    if hasattr(payload.dob, "isoformat"):
        dob_value = payload.dob.isoformat()
    elif payload.dob is not None:
        dob_value = str(payload.dob)

    # 4. INITIALIZE PROFILE: Safe now because auth.users row exists
    initial_profile_row = {
        "id": generated_uuid,
        "first_name": payload.first_name,
        "middle_name": payload.middle_name,
        "last_name": payload.last_name,
        "email": payload.email,
        "phone_no": payload.phone_no,
        "wallet_balance": 0.00,
        "verified_bvn": payload.bvn,
        "verified_nin": payload.nin,
        "verified_dob": dob_value,
        "identity_status": "VERIFIED",
        "nomba_account_ref": tracking_reference,
        "nomba_virtual_account": "PENDING_PROVISIONING"
    }

    try:
        supabase_admin.table("profiles").insert(initial_profile_row).execute()
    except Exception as db_err:
        logger.critical(f"Database row write failed: {db_err}")
        # Rollback strategy: Clean up orphaned auth user if the database profile insert fails
        try:
            supabase_admin.auth.admin.delete_user(generated_uuid)
        except Exception as rollback_err:
            logger.error(f"Failed to rollback auth user {generated_uuid}: {rollback_err}")
        raise HTTPException(status_code=500, detail="Profile record synchronization failed.")

    # 5. BANK PROVISIONING
    try:
        nomba_result = await create_virtual_account(
            user_uuid=generated_uuid,
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            middle_name=payload.middle_name,
            bvn=getattr(payload, "bvn", None)  # Pulls the BVN safely from your signup payload object
        )

        if not nomba_result.get("success"):
            raise Exception(f"Provisioning Failed: {nomba_result.get('error_reason', 'Unknown API Error')}")

        account_number = nomba_result["account_number"]
        bank_name = nomba_result["bank_name"]

        supabase_admin.table("profiles").update({
            "nomba_virtual_account": account_number,
            "nomba_bank_name": bank_name
        }).eq("id", generated_uuid).execute()

        return {
            "status": "success",
            "message": "User wallet infrastructure initialized completely.",
            "user_id": generated_uuid,
            "virtual_account": account_number,
            "bank": bank_name
        }

    except Exception as gateway_err:
        logger.error(f"Nomba banking engine tracking failed for user {generated_uuid}: {gateway_err}")
        
        supabase_admin.table("profiles").update({
            "nomba_virtual_account": "FAILED_VA_PROVISIONING",
            "nomba_bank_name": "UNKNOWN"
        }).eq("id", generated_uuid).execute()

        return {
            "status": "partial_success",
            "message": "Profile created. Wallet allocation pending background processing.",
            "user_id": generated_uuid
        }



  

@router.post("/login", status_code=status.HTTP_200_OK)
async def user_login(payload: UserLoginCredentials):
    """
    Uses the submitted phone number to find the matching profile email,
    then authenticates that Supabase Auth account with the password.
    """
    supabase_admin = get_supabase_admin()

    try:
        profile_response = (
            supabase_admin.table("profiles")
            .select("email")
            .eq("phone_no", payload.phone_no)
            .limit(1)
            .execute()
        )

        profile_rows = profile_response.data or []
        if not profile_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account was found for this phone number.",
            )

        user_email = profile_rows[0].get("email")
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account is missing an email address. Please contact support.",
            )

        session_auth = supabase_admin.auth.sign_in_with_password({
            "email": user_email,
            "password": payload.password
        })

        access_token = session_auth.session.access_token
        refresh_token = session_auth.session.refresh_token
        user_uuid = session_auth.user.id

        logger.info(f"User {user_uuid} successfully validated session access.")

        return {
            "status": "success",
            "message": "Login Successful",
            "data": {
                "user_id": user_uuid,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
        }

    except HTTPException:
        raise
    except Exception as auth_fail_error:
        logger.warning(f"Failed authentication login attempt for phone: {payload.phone_no}. Trace: {auth_fail_error}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Phone or Password credentials. Please check your inputs and try again."
        )

