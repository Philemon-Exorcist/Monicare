from integrations.nomba_client import NombaAPIClient


async def get_sub_account_balance() -> dict:
    """Return the configured Nomba sub-account balance."""
    client = NombaAPIClient()
    return await client.get_subaccount_wallet_balance()
