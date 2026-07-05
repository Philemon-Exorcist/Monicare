
from fastapi import APIRouter, Depends, status
from models.fallback_schema import ManualFallbackContributionRequest
from integrations.fallback_action import process_manual_fallback_payment
from app.auth import verify_user_token

router = APIRouter(prefix="/api/v1/groups/fallback", tags=["Group Savings - Fallback Recovery"])

@router.post("/pay-overdue", status_code=status.HTTP_200_OK)
async def clear_overdue_thrift_contribution(
    payload: ManualFallbackContributionRequest,
    current_user = Depends(verify_user_token)
):
    """
    Protected endpoint allowing users to manually settle an overdue 
    contribution schedule round using their funded wallet balances.
    """
    user_uuid = str(getattr(current_user, "id", None))
    
    # Process the contribution recovery payment
    result = await process_manual_fallback_payment(user_uuid=user_uuid, payload=payload)
    return result
