import json
import logging
from integrations.nomba_client import NombaAPIClient
from models.nomba_schema import NombaVirtualAccountRequest
from datetime import datetime, timedelta

logger = logging.getLogger("Monicare.nomba_actions")
nomba_client = NombaAPIClient()
async def create_virtual_account(
    user_uuid: str, 
    first_name: str, 
    last_name: str, 
    email: str, 
    middle_name: str | None = None,
    bvn: str | None = None
) -> dict:
    """
    Communicates with Nomba's API to provision a sub-account virtual account.
    """
    tracking_reference = f"USER_REF_{user_uuid}"
    
    # FIX 1: Provide a clean Name containing letters and spaces only. No prefixes/hyphens.
    m_part = f" {middle_name.strip()}" if middle_name and middle_name.strip() else ""
    clean_name = f"{first_name.strip()}{m_part} {last_name.strip()}"
    clean_name = clean_name[:40].strip()
    
    # FIX 2: Compute a standard expiration target (e.g., 3 years into the future)
    future_expiry = (datetime.utcnow() + timedelta(days=365 * 3)).strftime("%Y-%m-%d %H:%M:%S")
    
    # Build payload with BVN and Expiry configurations included
    nomba_payload = NombaVirtualAccountRequest(
        account_name=clean_name,
        account_ref=tracking_reference,
        bvn=bvn.strip() if bvn else None,
        expiry_date=future_expiry,
        expected_amount="0.00"  # Set to "0.00" for an open, multi-use collection setup
    )
    
    logger.info(f"OUTBOUND NOMBA SUB-ACCOUNT PAYLOAD: {json.dumps(nomba_payload.model_dump(by_alias=True, exclude_none=True))}")
    
    try:
        nomba_result = await nomba_client.create_user_virtual_account(nomba_payload)
        
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