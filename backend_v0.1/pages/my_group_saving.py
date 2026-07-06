import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import verify_user_token
from app.supabase_client import get_supabase_admin

logger = logging.getLogger("Monicare.group_saving")

group_router = APIRouter(prefix="/api/v1/group_saving", tags=["Group Saving"])


@group_router.get("/my_savings_groups", status_code=status.HTTP_200_OK)
async def get_savings_groups(current_user=Depends(verify_user_token)):
    """
    Return all savings groups the signed-in user belongs to.
    """
    supabase_admin = get_supabase_admin()
    current_user_id = getattr(current_user, "id", None)

    if not current_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be signed in to view your groups.",
        )

    try:
        user_uuid = UUID(str(current_user_id))
    except Exception as err:
        logger.warning("Invalid user UUID while loading savings groups: %s", err)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session user.",
        )

    try:
        memberships_response = (
            supabase_admin.table("group_members")
            .select("group_id,slot_position,joined_at")
            .eq("user_id", str(user_uuid))
            .order("joined_at", desc=False)
            .execute()
        )
        memberships = memberships_response.data or []

        if not memberships:
            return {
                "status": "success",
                "message": "No savings groups found for this user.",
                "data": [],
            }

        group_ids = [row["group_id"] for row in memberships if row.get("group_id")]
        if not group_ids:
            return {
                "status": "success",
                "message": "No savings groups found for this user.",
                "data": [],
            }

        groups_response = (
            supabase_admin.table("savings_groups")
            .select(
                "group_id,group_name,contribution_amount,cycle_period,max_slots,status,current_cycle_round,nomba_sub_account_id,creator_id,group_link,activated_at,created_at"
            )
            .in_("group_id", group_ids)
            .execute()
        )
        groups = groups_response.data or []

        groups_by_id = {str(group["group_id"]): group for group in groups if group.get("group_id")}
        membership_by_group = {str(row["group_id"]): row for row in memberships if row.get("group_id")}

        result = []
        for group_id in group_ids:
            group = groups_by_id.get(str(group_id))
            membership = membership_by_group.get(str(group_id))
            if not group:
                continue

            result.append({
                "group_id": group.get("group_id"),
                "group_name": group.get("group_name"),
                "contribution_amount": group.get("contribution_amount"),
                "cycle_period": group.get("cycle_period"),
                "max_slots": group.get("max_slots"),
                "status": group.get("status"),
                "current_cycle_round": group.get("current_cycle_round"),
                "nomba_sub_account_id": group.get("nomba_sub_account_id"),
                "creator_id": group.get("creator_id"),
                "group_link": group.get("group_link"),
                "activated_at": group.get("activated_at"),
                "created_at": group.get("created_at"),
                "joined_at": membership.get("joined_at") if membership else None,
                "slot_position": membership.get("rotation_position") if membership else None,
            })

        return {
            "status": "success",
            "message": "Retrieved savings groups successfully.",
            "data": result,
        }

    except HTTPException:
        raise
    except Exception as err:
        logger.error("Failed to retrieve savings groups for %s: %s", current_user_id, err, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load your savings groups right now.",
        )
