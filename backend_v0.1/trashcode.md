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




# checking
    tracking_reference = f"USER_REF_{user_uuid}"
    
    # Clean up and space the middle name correctly if it exists
    middle_part = f" {middle_name} " if middle_name and middle_name.strip() else " "
    full_account_name = f"Monicare - {first_name.strip()}{middle_part}{last_name.strip()}"
    
    # FIX: Instantiating the Pydantic object using its native Python snake_case keys
    nomba_payload = NombaVirtualAccountRequest(
        account_name=full_account_name,
        email=email,
        signing_bank="WEMA",
        account_reference=tracking_reference
    )
    
    try:
        # Fire request through your core integration proxy instance
        nomba_result = await nomba_client.create_user_virtual_account(nomba_payload)
        
        return {
            "success": True,
            "account_number": nomba_result.data.account_number,
            "bank_name": nomba_result.data.bank_name,
            "account_ref": tracking_reference
        }
    except Exception as gateway_err:
        # Catches network, HTTP, or validation errors cleanly
        logger.error(f"Failed to generate Nomba node for user {user_uuid}: {gateway_err}", exc_info=True)
        return {
            "success": False,
            "account_number": "FAILED_VA_PROVISIONING",
            "bank_name": "UNKNOWN",
            "account_ref": tracking_reference
        }


"""
# ─── PYDANTIC SCHEMAS ───
class NombaVirtualAccountRequest(BaseModel):
    # Matches the current Nomba virtual account docs:
    # required: accountRef, accountName
    # optional: bvn, expiryDate, expectedAmount
    account_ref: str = Field(alias="accountRef", min_length=16, max_length=64)
    account_name: str = Field(alias="accountName", min_length=8, max_length=64)
    bvn: Optional[str] = Field(default=None, min_length=8, max_length=11)
    expiry_date: Optional[str] = Field(default=None, alias="expiryDate")
    expected_amount: Optional[float] = Field(default=None, alias="expectedAmount")

    model_config = {
        "populate_by_name": True
    }


class NombaAccountData(BaseModel):
    account_holder_id: Optional[str] = Field(default=None, alias="accountHolderId")
    account_name: str = Field(alias="accountName")
    account_number: Optional[str] = Field(default=None, alias="bankAccountNumber")  # Maps NUBAN number
    bank_name: str = Field(alias="bankName")
    account_reference: str = Field(alias="accountRef")
    currency: Optional[str] = Field(default="NGN")
    expired: Optional[bool] = Field(default=False)

# ─── THE NEW ROBUST ENVELOPE SCHEMA ───
class NombaVirtualAccountResponse(BaseModel):
    code: str  # "00" means absolute success, other codes mean validation failures
    description: str  # Clear error message string from Nomba engineers
    status: Optional[bool] = None
    data: Optional[NombaAccountData] = None  # Populated only if code == "00"
    
    model_config = {
        "populate_by_name": True
    }

"""



"""
# 5. BANK PROVISIONING
    try:
        nomba_result = await create_virtual_account(
            user_uuid=generated_uuid,
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            middle_name=payload.middle_name
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
            "message": f"Profile created. Wallet allocation pending background processing.",
            "user_id": generated_uuid
        }

"""

# group

"""
asyn def create_group_saving(payload: GroupSavingCreateSchema):

    #Creates a new group saving record in the database.

    supabase_admin = get_supabase_admin()

    try:
        # Insert the new group saving record into the "group_savings" table
        response = supabase_admin.table("group_savings").insert({
            "group_name": payload.group_name,
            "target_amount": payload.target_amount,
            "contribution_amount": payload.contribution_amount,
            "contribution_frequency": payload.contribution_frequency,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "created_by": payload.created_by
        }).execute()

        if response.status_code == 201:
            return {
                "status": "success",
                "message": "Group saving created successfully.",
                "data": response.data
            }
        else:
            return {
                "status": "error",
                "message": f"Failed to create group saving: {response.error_message}"
            }

    except Exception as e:
        logger.error(f"Error creating group saving: {e}")
        return {
            "status": "error",
            "message": f"An error occurred while creating group saving: {str(e)}"
        }
"""


# virtual account
"""
async def create_virtual_account(user_uuid: str, first_name: str, last_name: str, email: str, middle_name: str | None = None) -> dict:
    '''
    Isolated business logic function that communicates with Nomba's API 
    and returns a clean dictionary containing the fresh bank details.
    '''
     
    tracking_reference = f"USER_REF_{user_uuid}"
    
    # Build clean name styling spacing strings
    middle_part = f" {middle_name} " if middle_name and middle_name.strip() else " "
    full_account_name = f"Monicare - {first_name.strip()}{middle_part}{last_name.strip()}"
    clean_name = full_account_name[:40].strip()
    # Nomba only expects the reference and display name for this flow.
    nomba_payload = NombaVirtualAccountRequest(
        account_name=clean_name,
        account_ref=tracking_reference,
    )

    # DEBUG TRACE: Print exactly what we send to Nomba to the logs
    logger.info(
        f"OUTBOUND NOMBA JSON PAYLOAD: {json.dumps(nomba_payload.model_dump(by_alias=True, exclude_none=True))}"
    )
    
    try:
        nomba_result = await nomba_client.create_user_virtual_account(nomba_payload)
        
        # Check if internal business validation passed
        if nomba_result.code != "00":
            return {"success": False, "error_reason": nomba_result.description}
            
        return {
            "success": True,
            "account_number": nomba_result.data.account_number,
            "bank_name": nomba_result.data.bank_name,
            "account_ref": tracking_reference
        }
    except Exception as gateway_err:
        logger.error(f"Failed to generate Nomba node for user {user_uuid}: {gateway_err}", exc_info=True)
        return {
            "success": False,
            "error_reason": str(gateway_err)
        }
   
   
"""



# Fetch group details along with an accurate count of joined participants
group_query = supabase_admin.table("savings_groups") \
    .select("*, group_members(count)") \
    .eq("id", target_group_id) \
    .single() \
    .execute()

# Extract data to build your response payload
group_data = group_query.data
joined_count = group_data.get("group_members", [{}])[0].get("count", 0)

response_payload = {
    **group_data,
    "total_joined_members": joined_count,
    "is_full": joined_count >= group_data["max_slots"]
}




Base: https://api.nomba.com (sandbox: https://sandbox.nomba.com). Every call: Authorization: Bearer + accountId: header; scope to your sub-account via the {subAccountId} path param.

Dedicated Virtual Accounts / VAs as infrastructure - unique VA per user, auto-reconcile via webhooks

POST /v1/accounts/virtual/{subAccountId} - create a VA under your sub-account
POST /v1/accounts/virtual/list - list/filter your VAs
GET /v1/accounts/virtual/{identifier} - fetch a VA · DELETE /v1/accounts/virtual/{identifier} - expire it
GET /v1/accounts/{subAccountId}/balance - balance
GET /v1/transactions/accounts/{subAccountId} - reconcile inflows · GET /v1/transactions/requery/{sessionId} - confirm




 
    """
    try:
        membership_response = (
            supabase_admin.table("group_members")
            .select("user_id")
            .eq("user_id", str(current_user_id))
            .eq("group_id", target_group_id) # FIX: Query cleanly on group_id relational keys
            .maybe_single()
            .execute()
        )
        membership = membership_response.data
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking pre-existing membership constraints: {err}",
        )

    if membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already an active member of this savings group.",
        )
    """



    async def lookup_bank_account_details(self, payload: BankLookupRequest) -> dict:
        """
        Queries Nomba's identity resolution matrix to fetch 
        and verify the legal owner name of a NUBAN bank account number.
        """
        token = await self._get_oauth_token()
        url = f"{self.base_url}/v1/accounts/lookup"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "accountId": self.parent_account_id,
            "Content-Type": "application/json"
        }
        
        json_data = payload.model_dump(by_alias=True)
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=json_data, headers=headers)
                response.raise_for_status()
                res_data = response.json()
                
                if res_data.get("code") != "00":
                    raise Exception(f"Account resolution rejected by switch: {res_data.get('description')}")
                    
                # Extract structural inner details
                account_info = res_data.get("data", {})
                return {
                    "success": True,
                    "account_name": account_info.get("accountName"),
                    "account_number": account_info.get("accountNumber"),
                    "bank_code": account_info.get("bankCode")
                }
            except httpx.HTTPStatusError as http_err:
                raise Exception(f"Nomba Bank Lookup Layer Error: {http_err.response.text}")



026-07-06 04:58:23 - [INFO] - HTTP Request: GET https://sxoaifgvldxcvoeyoezj.supabase.co/auth/v1/user "HTTP/2 200 OK"
2026-07-06 04:58:23 - [INFO] - User fb727973-b851-41b6-8c4c-76b1e27de041 accessed the home endpoint.
2026-07-06 04:58:24 - [INFO] - HTTP Request: GET https://sxoaifgvldxcvoeyoezj.supabase.co/rest/v1/profiles?select=first_name%2Clast_name%2Cnomba_bank_name%2Cnomba_virtual_account%2Cwallet_balance&id=eq.fb727973-b851-41b6-8c4c-76b1e27de041 "HTTP/2 200 OK"
2026-07-06 04:58:24 - [INFO] - HTTP Request: GET https://sxoaifgvldxcvoeyoezj.supabase.co/rest/v1/group_members?select=group_id%2Crotation_position%2Cjoined_at&user_id=eq.fb727973-b851-41b6-8c4c-76b1e27de041&order=rotation_position.asc "HTTP/2 400 Bad Request"
2026-07-06 04:58:24 - [ERROR] - Failed to load group memberships for fb727973-b851-41b6-8c4c-76b1e27de041: {'message': 'column group_members.rotation_position does not exist', 'code': '42703', 'hint': None, 'details': None}
Traceback (most recent call last):
  File "/opt/render/project/src/backend_v0.1/pages/home.py", line 53, in home
    .execute()
     ~~~~~~~^^
  File "/opt/render/project/src/backend_v0.1/.venv/lib/python3.14/site-packages/postgrest/_sync/request_builder.py", line 96, in execute
    raise APIError(dict(json_obj))
postgrest.exceptions.APIError: {'message': 'column group_members.rotation_position does not exist', 'code': '42703', 'hint': None, 'details': None}
2026-07-06 04:58:24 - [INFO] - ✅ COMPLETED REQUEST: GET -> /api/v1/dashboard | Status: 200 | Time: 519.01ms
INFO:     102.90.103.181:0 - "GET /api/v1/dashboard HTTP/1.1" 200 OK
2026-07-06 04:58:55 - [INFO] - HTTP Request: GET https://sxoaifgvldxcvoeyoezj.supabase.co/rest/v1/savings_groups?select=id%2Cstatus%2Cmax_slots&status=eq.DRAFT "HTTP/2 400 Bad Request"
2026-07-06 04:58:55 - [ERROR] - Failed to load draft groups for auto-activation: {'message': 'column savings_groups.id does not exist', 'code': '42703', 'hint': None, 'details': None}
Traceback (most recent call last):
  File "/opt/render/project/src/backend_v0.1/core/activate_group.py", line 85, in activate_groups_by_max_slots
    .execute()
     ~~~~~~~^^
  File "/opt/render/project/src/backend_v0.1/.venv/lib/python3.14/site-packages/postgrest/_sync/request_builder.py", line 96, in execute
    raise APIError(dict(json_obj))
postgrest.exceptions.APIError: {'message': 'column savings_groups.id does not exist', 'code': '42703', 'hint': None, 'details': None}
2026-07-06 05:00:35 - [INFO] - 🚀 INCOMING REQUEST: POST -> /api/v1/login
2026-07-06 05:00:35 - [INFO] - HTTP Request: GET https://sxoaifgvldxcvoeyoezj.supabase.co/rest/v1/profiles?select=email&phone_no=eq.09067860967&limit=1 "HTTP/2 200 OK"
2026-07-06 05:00:36 - [INFO] - HTTP Request: POST https://sxoaifgvldxcvoeyoezj.supabase.co/auth/v1/token?grant_type=password "HTTP/2 200 OK"
2026-07-06 05:00:36 - [INFO] - User dc0d2e0a-196c-4a60-91a9-15c9c3994e28 successfully validated session access.
2026-07-06 05:00:36 - [INFO] - ✅ COMPLETED REQUEST: POST -> /api/v1/login | Status: 200 | Time: 828.08ms
INFO:     102.90.103.181:0 - "POST /api/v1/login HTTP/1.1" 200 OK
2026-07-06 05:01:46 - [INFO] - 🚀 INCOMING REQUEST: POST -> /api/v1/create_savings_group
2026-07-06 05:01:46 - [INFO] - HTTP Request: GET https://sxoaifgvldxcvoeyoezj.supabase.co/auth/v1/user "HTTP/2 200 OK"
2026-07-06 05:01:46 - [INFO] - HTTP Request: POST https://sxoaifgvldxcvoeyoezj.supabase.co/rest/v1/savings_groups?select=%2A "HTTP/2 400 Bad Request"
2026-07-06 05:01:46 - [ERROR] - Failed to create savings group: {'message': "Could not find the 'title' column of 'savings_groups' in the schema cache", 'code': 'PGRST204', 'hint': None, 'details': None}
Traceback (most recent call last):
  File "/opt/render/project/src/backend_v0.1/core/create_savings_group.py", line 68, in create_savings_group
    .execute()
     ~~~~~~~^^
  File "/opt/render/project/src/backend_v0.1/.venv/lib/python3.14/site-packages/postgrest/_sync/request_builder.py", line 96, in execute
    raise APIError(dict(json_obj))
postgrest.exceptions.APIError: {'message': "Could not find the 'title' column of 'savings_groups' in the schema cache", 'code': 'PGRST204', 'hint': None, 'details': None}
2026-07-06 05:01:46 - [INFO] - ✅ COMPLETED REQUEST: POST -> /api/v1/create_savings_group | Status: 500 | Time: 600.94ms
INFO:     102.90.103.181:0 - "POST /api/v1/create_savings_group HTTP/1.1" 500 Internal Server Error
2026-07-06 05:02:40 - [INFO] - 🚀 INCOMING REQUEST: GET -> /health
2026-07-06 05:02:40 - [INFO] - ✅ COMPLETED REQUEST: GET -> /health | Status: 200 | Time: 0.63ms
INFO:     74.220.51.133:0 - "GET /health HTTP/1.1" 200 OK
2026-07-06 05:02:40 - [INFO] - HTTP Request: GET https://monicare.onrender.com/health "HTTP/1.1 200 OK"
2026-07-06 05:02:40 - [INFO] - Keepalive ping https://monicare.onrender.com/health -> 200
2026-07-06 05:03:55 - [INFO] - HTTP Request: GET https://sxoaifgvldxcvoeyoezj.supabase.co/rest/v1/savings_groups?select=id%2Cstatus%2Cmax_slots&status=eq.DRAFT "HTTP/2 400 Bad Request"
2026-07-06 05:03:55 - [ERROR] - Failed to load draft groups for auto-activation: {'message': 'column savings_groups.id does not exist', 'code': '42703', 'hint': None, 'details': None}
Traceback (most recent call last):
  File "/opt/render/project/src/backend_v0.1/core/activate_group.py", line 85, in activate_groups_by_max_slots
    .execute()
     ~~~~~~~^^
  File "/opt/render/project/src/backend_v0.1/.venv/lib/python3.14/site-packages/postgrest/_sync/request_builder.py", line 96, in execute
    raise APIError(dict(json_obj))
postgrest.exceptions.APIError: {'message': 'column savings_groups.id does not exist', 'code': '42703', 'hint': None, 'details': None}
2026-07-06 05:07:22 - [INFO] - 🚀 INCOMING REQUEST: GET -> /health
2026-07-06 05:07:22 - [INFO] - ✅ COMPLETED REQUEST: GET -> /health | Status: 200 | Time: 0.60ms



2026-07-06 05:12:22 - [ERROR] - Failed to load draft groups for auto-activation: {'message': 'column savings_groups.id does not exist', 'code': '42703', 'hint': None, 'details': None}
Traceback (most recent call last):
  File "/opt/render/project/src/backend_v0.1/core/activate_group.py", line 85, in activate_groups_by_max_slots
    .execute()
     ~~~~~~~^^
  File "/opt/render/project/src/backend_v0.1/.venv/lib/python3.14/site-packages/postgrest/_sync/request_builder.py", line 96, in execute
    raise APIError(dict(json_obj))
postgrest.exceptions.APIError: {'message': 'column savings_groups.id does not exist', 'code': '42703', 'hint': None, 'details': None}
2026-07-06 05:12:22 - [INFO] - HTTP Request: GET https://sxoaifgvldxcvoeyoezj.supabase.co/rest/v1/group_schedules?select=id%2Cgroup_id%2Cuser_id%2Camount_due%2Cpayment_status%2Ccycle_round&payment_status=in.%28PENDING%2CDUE%2COVERDUE%29 "HTTP/2 404 Not Found"
2026-07-06 05:12:22 - [INFO] - group_schedules not ready or query failed; skipping cron collection: {'message': "Could not find the table 'public.group_schedules' in the schema cache", 'code': 'PGRST205', 'hint': "Perhaps you meant the table 'public.group_members'", 'details': None}