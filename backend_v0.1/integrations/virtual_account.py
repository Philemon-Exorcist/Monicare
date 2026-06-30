import logging
from integrations.nomba_client import NombaAPIClient
from models.nomba_schema import NombaVirtualAccountRequest

logger = logging.getLogger("Monicare.nomba_actions")
nomba_client = NombaAPIClient()

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
