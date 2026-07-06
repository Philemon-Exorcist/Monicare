# helps user to join a group via the group link

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import verify_user_token
from app.supabase_client import get_supabase_admin

link_router = APIRouter(prefix="/api/v1/group_saving", tags=["Group Saving"])


@link_router.get("/join_via_link", status_code=status.HTTP_200_OK)
async def join_group_via_link(group_link: str, current_user=Depends(verify_user_token)):
    """
    Fetch group details by invite link.
    """
    supabase_admin = get_supabase_admin()
    current_user_id = getattr(current_user, "id", None)

    if not current_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be signed in to join a savings group.",
        )

    try:
        group_response = (
            supabase_admin.table("savings_groups")
            .select("id, title, max_slots, status, contribution_amount, cycle_period, current_cycle_round, group_link")
            .eq("group_link", group_link)
            .maybe_single()
            .execute()
        )
        group = group_response.data if group_response else None
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching group details: {err}",
        )

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No savings group found for the provided link.",
        )

    return {
        "message": "Group details fetched successfully.",
        "data": {
            "group_id": group.get("id"),
            "group_name": group.get("title"),
            "max_slots": group.get("max_slots"),
            "status": group.get("status"),
            "contribution_amount": group.get("contribution_amount"),
            "cycle_period": group.get("cycle_period"),
            "current_cycle_round": group.get("current_cycle_round"),
            "group_link": group.get("group_link"),
        },
    }


@link_router.post("/accept_invitation", status_code=status.HTTP_200_OK)
async def accept_group_invitation(group_link: str, current_user=Depends(verify_user_token)):
    """
    Validate a unique link, check capacity, and insert the user into the group membership matrix.
    """
    supabase_admin = get_supabase_admin()
    current_user_id = getattr(current_user, "id", None)

    if not current_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be signed in to join a savings group.",
        )

    try:
        group_response = (
            supabase_admin.table("savings_groups")
            .select("group_id, group_name, max_slots, status, contribution_amount, cycle_period")
            .eq("group_link", group_link)
            .maybe_single()
            .execute()
        )
        group = group_response.data if group_response else None
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database communication drop fetching group states: {err}",
        )

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No savings group found for the provided invitation link.",
        )

    target_group_id = group["group_id"]

    try:
        membership_response = (
            supabase_admin.table("group_members")
            .select("user_id")
            .eq("user_id", str(current_user_id))
            .eq("group_id", target_group_id)
            .maybe_single()
            .execute()
        )
        membership = membership_response.data if membership_response else None
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking pre-existing membership constraints: {err}",
        )

    if membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already an active member of this savings group.",
        )

    try:
        members_count_response = (
            supabase_admin.table("group_members")
            .select("user_id", count="exact")
            .eq("group_id", target_group_id)
            .execute()
        )
        members_count = members_count_response.count or 0
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error counting member slots: {err}",
        )

    if members_count >= group["max_slots"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This savings group has filled all available participant slots.",
        )

    assigned_rotation_position = members_count + 1

    try:
        supabase_admin.table("group_members").insert({
            "group_id": target_group_id,
            "user_id": str(current_user_id),
            "slot_position": assigned_rotation_position,
        }).execute()
    except Exception as insert_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record group member registration row: {insert_err}",
        )

    return {
        "status": "success",
        "message": f"Successfully joined the savings group '{group['title']}'!",
        "data": {
            "group_id": target_group_id,
            "assigned_rotation_position": assigned_rotation_position,
            "total_members": assigned_rotation_position,
        },
    }
