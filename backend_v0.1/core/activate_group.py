import logging
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status

from app.supabase_client import get_supabase_admin

logger = logging.getLogger("Monicare.activate_group")


async def activate_group_by_button(group_id: str, creator_id: str) -> dict:
    if not group_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group ID is required.")

    try:
        UUID(group_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID.")

    if not creator_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    supabase_admin = get_supabase_admin()
    try:
        group_response = (
            supabase_admin.table("savings_groups")
            .select("group_id,creator_id,status,max_slots")
            .eq("group_id", group_id)
            .maybe_single()
            .execute()
        )
        group = group_response.data
    except Exception as err:
        logger.error("Failed to load group %s: %s", group_id, err, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to load group information.")

    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")

    if str(group.get("creator_id")) != str(creator_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the group creator can activate this group.")

    if group.get("status") == "ACTIVE":
        return {
            "message": "Group is already active.",
            "data": {
                "group_id": group_id,
                "status": "ACTIVE",
            },
        }

    if group.get("status") != "DRAFT":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group cannot be activated in its current state.")

    activated_at = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    try:
        supabase_admin.table("savings_groups").update({
            "status": "ACTIVE",
            "activated_at": activated_at,
        }).eq("id", group_id).execute()
    except Exception as err:
        logger.error("Failed to activate group %s: %s", group_id, err, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to activate group.")

    return {
        "message": "Group activated successfully.",
        "data": {
            "group_id": group_id,
            "status": "ACTIVE",
            "activated_at": activated_at,
        },
    }


async def activate_groups_by_max_slots() -> list[str]:
    supabase_admin = get_supabase_admin()
    activated_group_ids: list[str] = []

    try:
        groups_response = (
            supabase_admin.table("savings_groups")
            .select("group_id,status,max_slots")
            .eq("status", "DRAFT")
            .execute()
        )
        draft_groups = groups_response.data or []
    except Exception as err:
        logger.error("Failed to load draft groups for auto-activation: %s", err, exc_info=True)
        return activated_group_ids

    for group in draft_groups:
        group_id = group.get("group_id")
        if not group_id:
            continue

        max_slots = group.get("max_slots") or 0
        if max_slots <= 0:
            continue

        try:
            members_response = (
                supabase_admin.table("group_members")
                .select("user_id")
                .eq("group_id", group_id)
                .execute()
            )
            member_count = len(members_response.data or [])
        except Exception as err:
            logger.warning("Failed to count members for group %s: %s", group_id, err)
            continue

        if member_count < max_slots:
            continue

        activated_at = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
        try:
            supabase_admin.table("savings_groups").update({
                "status": "ACTIVE",
                "activated_at": activated_at,
            }).eq("group_id", group_id).execute()
            activated_group_ids.append(str(group_id))
            logger.info("Auto-activated group %s by reaching max slot capacity.", group_id)
        except Exception as err:
            logger.error("Failed to auto-activate group %s: %s", group_id, err, exc_info=True)

    return activated_group_ids
