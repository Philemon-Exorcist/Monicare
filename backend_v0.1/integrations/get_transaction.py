import httpx

from integrations.nomba_client import NombaAPIClient


async def get_transaction_details(user_id: str, transaction_id: str) -> dict:
    """
    Fetch a transaction record from Nomba.
    The `user_id` argument is kept for compatibility with the existing call shape.
    """
    client = NombaAPIClient()
    token = await client._get_oauth_token()
    url = f"{client.base_url}/v1/transactions/{transaction_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "accountId": client.parent_account_id,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as http_client:
        response = await http_client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
