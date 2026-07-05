from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import verify_user_token
from core.contributions import execute_group_contribution
from models.group_saving_schema import GroupContributionRequest

group_payment_router = APIRouter(prefix="/api/v1/group_saving", tags=["Group Saving"])


@group_payment_router.post("/contribute", status_code=status.HTTP_200_OK)
async def contribute_to_group(
    payload: GroupContributionRequest,
    current_user=Depends(verify_user_token),
):
    user_uuid = str(getattr(current_user, "id", None))
    if not user_uuid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be signed in to contribute to a group.",
        )

    return await execute_group_contribution(user_uuid=user_uuid, payload=payload)
