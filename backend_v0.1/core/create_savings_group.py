import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import verify_user_token
from app.supabase_client import get_supabase_admin
from models.group_saving_schema import SavingsGroupCreate
from models.nomba_schema import settings

logger = logging.getLogger("Monicare.group_saving")

group_router = APIRouter(prefix="/api/v1/group_saving", tags=["Group Saving"])


@group_router.post("/create_savings_group", status_code=status.HTTP_201_CREATED)
async def create_savings_group(
    payload: SavingsGroupCreate,
    current_user=Depends(verify_user_token),
):
    """
    Create a new savings group, seed the creator as the first member,
    and bind the group to the configured Nomba sub-account vault.
    """
    supabase_admin = get_supabase_admin()
    creator_id = getattr(current_user, "id", None)

    if not creator_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be signed in to create a savings group.",
        )

    try:
        creator_uuid = UUID(str(creator_id))
    except Exception as err:
        logger.warning("Invalid creator UUID for group creation: %s", err)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session user.",
        )

    nomba_sub_account_id = getattr(settings, "NOMBA_SUB_ACCOUNT_ID", None)
    if not nomba_sub_account_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Nomba sub-account is not configured.",
        )

    group_row = {
        "creator_id": str(creator_uuid),
        "title": payload.group_name.strip(),
        "contribution_amount": str(payload.contribution_amount),
        "cycle_period": payload.cycle_period.value,
        "max_slots": payload.max_slots,
        "status": "DRAFT",
        "current_cycle_round": 1,
        "nomba_sub_account_id": nomba_sub_account_id,
    }

    try:
        created_group_response = (
            supabase_admin.table("savings_groups")
            .insert(group_row)
            .select("*")
            .execute()
        )
        created_group = (created_group_response.data or [None])[0]
        if not created_group:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Group creation returned no record.",
            )

        group_id = created_group.get("id")
        if not group_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Group id was not returned after creation.",
            )

        supabase_admin.table("group_members").insert({
            "group_id": group_id,
            "user_id": str(creator_uuid),
            "rotation_position": 1,
        }).execute()

        return {
            "status": "success",
            "message": "Savings group created successfully.",
            "data": {
                "group_id": group_id,
                "group_name": created_group.get("title"),
                "contribution_amount": created_group.get("contribution_amount"),
                "cycle_period": created_group.get("cycle_period"),
                "max_slots": created_group.get("max_slots"),
                "status": created_group.get("status"),
                "current_cycle_round": created_group.get("current_cycle_round"),
                "nomba_sub_account_id": created_group.get("nomba_sub_account_id"),
                "creator_id": created_group.get("creator_id"),
                "created_at": created_group.get("created_at"),
            },
        }

    except HTTPException:
        raise
    except Exception as err:
        logger.error("Failed to create savings group: %s", err, exc_info=True)
        try:
            if "group_id" in locals():
                supabase_admin.table("savings_groups").delete().eq("id", group_id).execute()
        except Exception as rollback_err:
            logger.error("Failed to rollback savings group %s: %s", group_id, rollback_err)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create savings group at this time.",
        )
