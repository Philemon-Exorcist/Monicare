import json
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
    
    # Build clean name styling spacing strings
    middle_part = f" {middle_name} " if middle_name and middle_name.strip() else " "
    full_account_name = f"Monicare - {first_name.strip()}{middle_part}{last_name.strip()}"
    clean_name = full_account_name[:40].strip()
    # Instantiate using correct Python field definitions matching the schema update above
    nomba_payload = NombaVirtualAccountRequest(
        account_name=clean_name,
        email=email,
        signing_bank="WEMA",
        account_ref=tracking_reference  ,# FIX: Changed from account_reference to account_ref
        currency="NGN"  # Fixed
        )

    # DEBUG TRACE: Print exactly what we send to Nomba to the logs
    logger.info(f"OUTBOUND NOMBA JSON PAYLOAD: {json.dumps(nomba_payload.model_dump(by_alias=True))}")
    
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
   
   