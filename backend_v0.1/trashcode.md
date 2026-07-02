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

















        
from pydantic import BaseModel, Field
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# ─── WHAT YOU SEND TO NOMBA ───
class NombaVirtualAccountRequest(BaseModel):
    account_name: str = Field(alias="accountName") # Maps Python snake_case to Nomba's camelCase
    email: str
    signing_bank: str = Field(default="WEMA", alias="signingBank")
    account_reference: str = Field(alias="accountReference")

    # This configuration configuration allows Pydantic to read both camelCase and snake_case keys
    model_config = {
        "populate_by_name": True
    }


# ─── INTERNAL METADATA INSIDE NOMBA'S RESPONSE ───
class NombaAccountData(BaseModel):
    account_name: str = Field(alias="accountName")
    account_number: str = Field(alias="accountNumber")
    bank_name: str = Field(alias="bankName")
    account_reference: str = Field(alias="accountReference")


# ─── WHAT NOMBA RETURNS TO YOU ───
class NombaVirtualAccountResponse(BaseModel):
    status: str
    message: str
    data: NombaAccountData
    
    model_config = {
        "populate_by_name": True
    }


class AppSettings(BaseSettings):
    # Enforces that these strings must be present in your .env file
    NOMBA_BASE_URL: str
    NOMBA_LIVE_CLIENT_ID: str = Field(alias="NOMBA_LIVE_ClIENT_ID")
    NOMBA_LIVE_PRIVATE_KEY: str = Field(alias="NOMBA_LIVE_PRIVATE_KEY")
    Main_Account_ID: str
    NOMBA_SUB_ACCOUNT_ID: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

# Initialize a single, reusable instance of your settings
settings = AppSettings()



class NombaAPIClient:
    def __init__(self):
        self.base_url = settings.NOMBA_BASE_URL
        self.client_id = settings.NOMBA_LIVE_CLIENT_ID
        self.client_secret = settings.NOMBA_LIVE_PRIVATE_KEY
        self.parent_account_id = settings.Main_Account_ID

        # Token Cache variables to protect network performance
        self._cached_token = None
        self._token_expires_at = 0


    async def _get_oauth_token(self) -> str:
        """Internal helper function to fetch short-lived HTTP Bearer token"""

        current_time = time.time()
        
        # If we have a valid, unexpired token in memory, reuse it instantly!
        if self._cached_token and current_time < self._token_expires_at:
            return self._cached_token

        url = f"{self.base_url}/auth/token/issue"
        headers = {
            "Content-Type": "application/json",
            "accountId": self.parent_account_id
        }
        payload = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()["data"]["access_token"]

    async def create_user_virtual_account(self, request_payload: NombaVirtualAccountRequest) -> NombaVirtualAccountResponse:
        """
        Isolated function that receives  typed Pydantic request object,
        fires it to Nomba, and returns a fully typed response object.
        """
        token = await self._get_oauth_token()
        url = f"{self.base_url}/accounts/virtual"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "accountId": self.parent_account_id,
            "Content-Type": "application/json"
        }
        
        # .model_dump(by_alias=True) converts your code to true Nomba camelCase JSON format
        json_data = request_payload.model_dump(by_alias=True)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=json_data, headers=headers)
            response.raise_for_status()
            
            # Converts Nomba's raw JSON response back into your structured Pydantic object
            return NombaVirtualAccountResponse.model_validate(response.json())


# creating virtual account
async def create_virtual_account(user_uuid: str, first_name: str, last_name: str, email: str, middle_name: str) -> dict:
    """
    Isolated business logic function that communicates with Nomba's API 
    and returns a clean dictionary containing the fresh bank details.
    """
    tracking_reference = f"USER_REF_{user_uuid}"
    
    # 1. Build the clean Pydantic request object
    middle_name = f"{middle_name}" if middle_name else ""
    nomba_payload = NombaVirtualAccountRequest(
        accountName=f"Monicare - {first_name}{middle_name}{last_name}",
        email=email,
        signingBank="WEMA",
        accountReference=tracking_reference
    )
    
    try:
        # 2. Fire request through your core integration proxy instance
        nomba_result = await nomba_client.create_user_virtual_account(nomba_payload)
        
        return {
            "success": True,
            "account_number": nomba_result.data.account_number,
            "bank_name": nomba_result.data.bank_name,
            "account_ref": tracking_reference
        }
    except Exception as gateway_err:
        logger.error(f"Failed to generate Nomba node for user {user_uuid}: {gateway_err}")
        return {
            "success": False,
            "account_number": "FAILED_VA_PROVISIONING",
            "bank_name": "UNKNOWN",
            "account_ref": tracking_reference
        }



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




#   """Fires payload to the sub-account virtual account endpoint"""
        token = await self._get_oauth_token()

        if self.sub_account_id:
            url = f"{self.base_url}/v1/accounts/virtual/{self.sub_account_id}"
        else:
            url = f"{self.base_url}/v1/accounts/virtual"
        
        # CRITICAL FIX: Appended sub_account_id path variable parameter
        #url = f"{self.base_url}/v1/accounts/virtual/{self.sub_account_id}"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "accountId": self.parent_account_id,
            "Content-Type": "application/json"
        }
        
        json_data = request_payload.model_dump(by_alias=True)
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=json_data, headers=headers)
                response.raise_for_status()
                return NombaVirtualAccountResponse.model_validate(response.json())
            except httpx.HTTPStatusError as http_err:
                # This unwraps the exact reason Nomba rejected your account parameters
                status_code = http_err.response.status_code
                raw_response = http_err.response.text
                logger.error(f"Nomba API Rejected Creation. Status: {status_code} | Response: {raw_response}")
                raise Exception(f"Nomba API Error [{status_code}]: {raw_response}")
                
            except Exception as e:
                logger.error(f"Unexpected connection failure with Nomba: {str(e)}")
                raise e



# 5. BANK PROVISIONING

    try:
        # Pass the raw payload strings and generated UUID straight to the wrapper function
        nomba_result = await create_virtual_account(
            user_uuid=generated_uuid,
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            middle_name=payload.middle_name
        )

        # Check if the wrapper internal try-except marked the request as a success
        if not nomba_result.get("success"):
            # If the client caught an issue internally, raise it to drop to the outer except block
            raise Exception("Nomba client proxy reported a provisioning failure.")

        account_number = nomba_result["account_number"]
        bank_name = nomba_result["bank_name"]

        # Update your Supabase profile record with the fresh bank details
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
        
        # Soft fallback: Save marker state to database so a cron/worker can retry it later
        supabase_admin.table("profiles").update({
            "nomba_virtual_account": "FAILED_VA_PROVISIONING",
            "nomba_bank_name": "UNKNOWN"
        }).eq("id", generated_uuid).execute()

        return {
            "status": "partial_success",
            "message": "Profile verified and created successfully. Wallet number generating in background.",
            "user_id": generated_uuid
        }
    else:
        logger.info(f"User {generated_uuid} successfully signed up and provisioned.")
        raise HTTPException(status_code=status.HTTP_201_CREATED, detail="Signup and wallet creation completed successfully.")
