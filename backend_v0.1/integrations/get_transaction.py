# this will get the transaction details for a particular user using the  nomba apiu
def get_transaction_details(user_id: str, transaction_id: str) -> dict:
    nomba_settings = NombaSettings()
    nomba_api_url = "https://api.nomba.com/v1/transactions"