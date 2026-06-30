

import httpx
from models.nomba_schema import settings
from models.nomba_schema import NombaVirtualAccountRequest, NombaVirtualAccountResponse
import time
import os
from dotenv import load_dotenv




class NombaAPIClient:
    def __init__(self):
        self.base_url = settings.nomba_base_url  # e.g., "https://nomba.com"
        self.client_id = settings.nomba_client_id
        self.client_secret = settings.nomba_client_secret
        self.parent_account_id = settings.nomba_parent_account_id

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
