import logging
from integrations.nomba_client import NombaAPIClient
from models.nomba_schema import NombaVirtualAccountRequest

logger = logging.getLogger("Monicare.nomba_actions")
nomba_client = NombaAPIClient()


async def create_virtual_account(user_uuid: str, first_name: str, last_name: str, email: str, middle_name: str | None = None) -> dict:
    """
    Isolated business logic function that communicates with Nomba's API 
    and returns a clean dictionary containing the fresh bank details.
    """
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


