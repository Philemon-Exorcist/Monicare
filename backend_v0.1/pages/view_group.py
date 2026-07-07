


# this gets the set group saving for a particular user
from fastapi import APIRouter, Depends, HTTPException, status
import logging
from app.auth import verify_user_token
from app.supabase_client import get_supabase_admin
from uuid import UUID

logger = logging.getLogger("Monicare.view_group")

view_router = APIRouter(prefix="/api/v1/group", tags=["Group Saving"])

@view_router.get("/{group_id}", status_code=status.HTTP_200_OK)
async def view_group_details(group_id: str, current_user=Depends(verify_user_token)) -> dict:
    """
    Retrieves all details for a group, including members, payout recipient, members who have paid, and members yet to be paid.
    """
    supabase_admin = get_supabase_admin()
    user_id = str(getattr(current_user, "id", None))

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    try:
        UUID(group_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID format.")

    try:
        # 1. Fetch group details
        group_response = (
            supabase_admin.table("savings_groups")
            .select("*")
            .eq("group_id", group_id)
            .maybe_single()
            .execute()
        )
        group = group_response.data

        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings group not found.")

        # 2. Fetch all members of the group
        members_response = (
            supabase_admin.table("group_members")
            .select("user_id, slot_position, joined_at, profiles(first_name, last_name)")
            .eq("group_id", group_id)
            .order("slot_position", desc=False)
            .execute()
        )
        members_data = members_response.data or []

        members_list = []
        for member in members_data:
            profile = member.get("profiles") or {}
            members_list.append({
                "user_id": member.get("user_id"),
                "slot_position": member.get("slot_position"),
                "joined_at": member.get("joined_at"),
                "first_name": profile.get("first_name"),
                "last_name": profile.get("last_name"),
            })

        # 3. Determine who is due for the current round
        current_round = group.get("current_cycle_round")
        person_due = None
        members_who_have_paid = []
        if current_round is not None:
            for member in members_list:
                if member.get("slot_position") == current_round:
                    person_due = {
                        "user_id": member.get("user_id"),
                        "first_name": member.get("first_name"),
                        "last_name": member.get("last_name"),
                        "slot_position": member.get("slot_position"),
                    }
                    break
        
            # 3a. Get members who have paid for the current round
            paid_members_response = (
                supabase_admin.table("group_schedules")
                .select("user_id")
                .eq("group_id", group_id)
                .eq("cycle_round", current_round)
                .eq("payment_status", "PAID")
                .execute()
            )
            paid_user_ids = {item['user_id'] for item in paid_members_response.data}
            
            members_who_have_paid = [
                member for member in members_list if member['user_id'] in paid_user_ids
            ]
        
        # 3b. Get members who are yet to be paid (future payout rounds)
        members_to_be_paid = [
            member for member in members_list if member.get("slot_position", -1) > (current_round or 0)
        ]
        # 4. Construct the final response
        group_details = {
            "group_id": group.get("group_id"),
            "group_name": group.get("group_name"),
            "contribution_amount": group.get("contribution_amount"),
            "cycle_period": group.get("cycle_period"),
            "max_slots": group.get("max_slots"),
            "status": group.get("status"),
            "creator_id": group.get("creator_id"),
            "group_link": group.get("group_link"),
            "activated_at": group.get("activated_at"),
            "created_at": group.get("created_at"),
            "current_cycle_round": group.get("current_cycle_round"),
            "current_total_saved": group.get("current_total_saved"),
            "nomba_sub_account_id": group.get("nomba_sub_account_id"),
            "members": members_list,
            "person_due_for_payout": person_due,
            "members_who_have_paid": members_who_have_paid,
            "members_to_be_paid": members_to_be_paid,
        }

        return {
            "status": "success",
            "message": "Group details retrieved successfully.",
            "data": group_details,
        }

    except HTTPException:
        raise
    except Exception as err:
        logger.error(
            "Failed to retrieve details for group %s for user %s: %s", group_id, user_id, err, exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load group details at this time.",
        )