@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup_and_create_account(payload: UserSignUpPayload):
    """
    1. Registers credentials inside Supabase Auth
    2. Inserts initial lock profile row into our profiles table
    3. Triggers Nomba to provision a real virtual account wallet
    """
    supabase_admin = get_supabase_admin()

    try:
        existing_user = supabase_admin.table("profiles") \
            .select("id").eq("email", payload.email).execute()

        if existing_user.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user profile with this phone number already exists on Akawo."
            )
    except HTTPException:
        raise
    except Exception as check_err:
        logger.error(f"Database pre-check error: {check_err}")
        raise HTTPException(status_code=500, detail="Internal server integrity check failed.")

    try:
        auth_response = supabase_admin.auth.admin.create_user({
           # "phone": payload.phone_no,
           "email": payload.email,
            "password": payload.password,
           # "phone_confirm": True, # <--- Instantly confirms the user in auth.users
            "email_confirm": True, # <--- Instantly confirms the user in auth.users
            "user_metadata": {
                "first_name": payload.first_name,
                "last_name": payload.last_name
            }
        })
      
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Authentication signup failed.")

        generated_uuid = auth_response.user.id
        tracking_reference = f"USER_REF_{generated_uuid}"

    except Exception as auth_err:
        logger.error(f"Supabase Auth signup failure: {auth_err}")
        raise HTTPException(status_code=400, detail=f"Authentication gate rejected: {str(auth_err)}")

    dob_value = payload.dob
    if hasattr(payload.dob, "isoformat"):
        dob_value = payload.dob.isoformat()
    elif payload.dob is not None:
        dob_value = str(payload.dob)

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
        raise HTTPException(status_code=500, detail="Profile record synchronization failed.")

    try:
        m_name = f" {payload.middle_name}" if payload.middle_name else ""
        nomba_request_payload = NombaVirtualAccountRequest(
            accountName=f"Akawo - {payload.first_name}{m_name} {payload.last_name}",
            email=payload.email,
            signingBank="WEMA",
            accountReference=tracking_reference
        )

        nomba_result = await create_virtual_account(nomba_request_payload)

        account_number = nomba_result.data.account_number
        bank_name = nomba_result.data.bank_name

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
        logger.error(f"Nomba banking engine timed out for user {generated_uuid}: {gateway_err}")
        supabase_admin.table("profiles").update({
            "nomba_virtual_account": "FAILED_VA_PROVISIONING"
        }).eq("id", generated_uuid).execute()

        return {
            "status": "partial_success",
            "message": "Profile verified and created successfully. Wallet number generating in background.",
            "user_id": generated_uuid
        }