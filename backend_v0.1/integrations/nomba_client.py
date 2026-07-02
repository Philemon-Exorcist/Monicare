
import httpx
from models.nomba_schema import settings
from models.nomba_schema import NombaVirtualAccountRequest, NombaVirtualAccountResponse
import time
import os
import logging

logger = logging.getLogger("Monicare.nomba_client")

class NombaAPIClient:
    def __init__(self):
        self.sand_box_url = settings.NOMBA_SANDBOX_URL
        self.base_url = settings.NOMBA_BASE_URL
        self.client_id = settings.NOMBA_LIVE_CLIENT_ID
        self.client_secret = settings.NOMBA_LIVE_PRIVATE_KEY
        self.parent_account_id = settings.Main_Account_ID
        self.sub_account_id = settings.NOMBA_SUB_ACCOUNT_ID

        self._cached_token = None
        self._token_expires_at = 0

    async def _get_oauth_token(self) -> str:
        """Internal helper function with working cache timeout verification"""
        current_time = time.time()
        
        # Buffer token expiration by 60 seconds for network latency protection
        if self._cached_token and current_time < (self._token_expires_at - 60):
            return self._cached_token

        url = f"{self.base_url}/v1/auth/token/issue"  # Standardized route path structure
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
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                res_data = response.json()["data"]
                
                # CRITICAL FIX: Storing expiration window timestamp data
                self._cached_token = res_data["access_token"]
                expires_in = res_data.get("expires_in", 3600)  # Defaulting 1 hour safely
                self._token_expires_at = current_time + expires_in
                
                return self._cached_token
            except httpx.HTTPStatusError as auth_err:
                    logger.error(f"Nomba Auth Token Issue Failed. Status: {auth_err.response.status_code}, Body: {auth_err.response.text}")
                    raise Exception(f"Nomba Authentication Failed: {auth_err.response.text}")

    async def create_user_virtual_account(self, request_payload: NombaVirtualAccountRequest) -> NombaVirtualAccountResponse:
        """Fires payload to the sub-account virtual account endpoint"""
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




