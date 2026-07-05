import logging
import time

import httpx

from models.nomba_schema import (
    NombaTransferRequest,
    NombaVirtualAccountRequest,
    NombaVirtualAccountResponse,
    settings,
)
from models.payout_schema import BankLookupRequest

logger = logging.getLogger("Monicare.nomba_client")


class NombaAPIClient:
    def __init__(self):
        self.sandbox_url = settings.NOMBA_SANDBOX_URL
        self.base_url = settings.NOMBA_BASE_URL
        self.client_id = settings.NOMBA_LIVE_CLIENT_ID
        self.client_secret = settings.NOMBA_LIVE_PRIVATE_KEY
        self.parent_account_id = settings.Main_Account_ID
        self.sub_account_id = settings.NOMBA_SUB_ACCOUNT_ID

        self._cached_token: str | None = None
        self._token_expires_at = 0.0

    def _require_value(self, value: str | None, setting_name: str) -> str:
        if not value:
            raise RuntimeError(f"{setting_name} is not configured.")
        return value

    async def _get_oauth_token(self) -> str:
        """Retrieve and cache a bearer token for Nomba API calls."""
        current_time = time.time()
        if self._cached_token and current_time < (self._token_expires_at - 60):
            return self._cached_token

        url = f"{self.base_url}/v1/auth/token/issue"
        headers = {
            "Content-Type": "application/json",
            "accountId": self._require_value(self.parent_account_id, "Main_Account_ID"),
        }
        payload = {
            "grant_type": "client_credentials",
            "client_id": self._require_value(self.client_id, "NOMBA_LIVE_CLIENT_ID"),
            "client_secret": self._require_value(self.client_secret, "NOMBA_LIVE_PRIVATE_KEY"),
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                response_data = response.json().get("data", {})

                self._cached_token = response_data["access_token"]
                expires_in = int(response_data.get("expires_in", 3600))
                self._token_expires_at = current_time + expires_in
                return self._cached_token
            except httpx.HTTPStatusError as auth_err:
                logger.error(
                    "Nomba auth token issue failed. status=%s body=%s",
                    auth_err.response.status_code,
                    auth_err.response.text,
                )
                raise RuntimeError(f"Nomba Authentication Failed: {auth_err.response.text}") from auth_err

    async def create_user_virtual_account(
        self, request_payload: NombaVirtualAccountRequest
    ) -> NombaVirtualAccountResponse:
        """Create a virtual account for a user using the configured sub-account."""
        token = await self._get_oauth_token()
        sub_account_id = self.sub_account_id

        if sub_account_id:
            url = f"{self.base_url}/v1/accounts/virtual/{sub_account_id}"
        else:
            url = f"{self.base_url}/v1/accounts/virtual"

        headers = {
            "Authorization": f"Bearer {token}",
            "accountId": self._require_value(self.parent_account_id, "Main_Account_ID"),
            "Content-Type": "application/json",
        }
        json_data = request_payload.model_dump(by_alias=True, exclude_none=True)

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, json=json_data, headers=headers)
                response.raise_for_status()

                parsed_response = NombaVirtualAccountResponse.model_validate(response.json())
                if parsed_response.code != "00":
                    logger.error(
                        "Nomba virtual account rejected. code=%s description=%s",
                        parsed_response.code,
                        parsed_response.description,
                    )
                    raise RuntimeError(
                        f"Nomba Rejection ({parsed_response.code}): {parsed_response.description}"
                    )

                return parsed_response
            except httpx.HTTPStatusError as http_err:
                logger.error("Nomba virtual account HTTP error: %s", http_err.response.text)
                raise RuntimeError(f"Nomba Network Error: {http_err.response.text}") from http_err

    async def execute_external_bank_payout(self, request_payload: NombaTransferRequest) -> dict:
        """Send an outbound bank transfer through Nomba."""
        token = await self._get_oauth_token()
        url = f"{self.base_url}/v1/transfers"
        headers = {
            "Authorization": f"Bearer {token}",
            "accountId": self._require_value(self.parent_account_id, "Main_Account_ID"),
            "Content-Type": "application/json",
        }
        json_data = request_payload.model_dump(by_alias=True, exclude_none=True)

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, json=json_data, headers=headers)
                response.raise_for_status()
                res_payload = response.json()

                response_code = str(res_payload.get("code", ""))
                if response_code not in {"00", "02"}:
                    logger.error("Nomba bank payout rejected: %s", res_payload)
                    raise RuntimeError(
                        f"Nomba Bank Switch Rejection: {res_payload.get('description', 'Unknown Transfer Failure')}"
                    )

                return res_payload
            except httpx.HTTPStatusError as http_err:
                logger.error("Nomba payout HTTP error: %s", http_err.response.text)
                raise RuntimeError(f"Nomba Network Transfer Error: {http_err.response.text}") from http_err

    async def get_subaccount_wallet_balance(self) -> dict:
        """Fetch current wallet balance for the configured sub-account."""
        token = await self._get_oauth_token()
        sub_account_id = self._require_value(self.sub_account_id, "NOMBA_SUB_ACCOUNT_ID")
        url = f"{self.base_url}/v1/accounts/sub-account/{sub_account_id}"

        headers = {
            "Authorization": f"Bearer {token}",
            "accountId": self._require_value(self.parent_account_id, "Main_Account_ID"),
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                res_payload = response.json()

                if res_payload.get("code") != "00":
                    raise RuntimeError(f"Nomba Balance Query Rejection: {res_payload.get('description')}")

                balance_data = res_payload.get("data", {})
                return {
                    "success": True,
                    "currency": balance_data.get("currency", "NGN"),
                    "total_balance": float(balance_data.get("accountBalance", 0.0)),
                    "available_balance": float(balance_data.get("withdrawableBalance", 0.0)),
                }
            except httpx.HTTPStatusError as http_err:
                raise RuntimeError(f"Nomba Balance Network Error: {http_err.response.text}") from http_err

    async def lookup_bank_account_details(self, payload: BankLookupRequest) -> dict:
        """Resolve a bank account name before payout."""
        token = await self._get_oauth_token()
        url = f"{self.base_url}/v1/accounts/lookup"

        headers = {
            "Authorization": f"Bearer {token}",
            "accountId": self._require_value(self.parent_account_id, "Main_Account_ID"),
            "Content-Type": "application/json",
        }
        json_data = payload.model_dump(by_alias=True, exclude_none=True)

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, json=json_data, headers=headers)
                response.raise_for_status()
                res_data = response.json()

                if res_data.get("code") != "00":
                    raise RuntimeError(f"Account resolution rejected by switch: {res_data.get('description')}")

                account_info = res_data.get("data", {})
                return {
                    "success": True,
                    "account_name": account_info.get("accountName"),
                    "account_number": account_info.get("accountNumber"),
                    "bank_code": account_info.get("bankCode"),
                }
            except httpx.HTTPStatusError as http_err:
                raise RuntimeError(f"Nomba Bank Lookup Layer Error: {http_err.response.text}") from http_err
