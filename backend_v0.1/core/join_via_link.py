# helps user to join a group via a the group link

from fastapi import HTTPException, status, APIRouter, Depends
from app.auth import verify_user_token      
from app.supabase_client import get_supabase_admin


link_router = APIRouter(prefix="/api/v1/group_saving", tags=["Group Saving"])



@link_router.get("/join_via_link", status_code=status.HTTP_200_OK)
async def join_group_via_link(group_link: str, current_user=Depends(verify_user_token)):
    """
    Allows a user to join a savings group using a unique group link.
    """
    supabase_admin = get_supabase_admin()
    current_user_id = getattr(current_user, "id", None)

    if not current_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be signed in to join a savings group.",
        )

    # Fetch the group details using the provided group link
    try:
        group_response = (
            supabase_admin.table("savings_groups")
            .select("id, title, max_slots, status","contribution_amount","cycle_period")
            .eq("group_link", group_link)
            .maybe_single()
            .execute()
        )
        group = group_response.data
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
    

# this assigned to a button that allows a user to join a group via the group link by pressing accept button

@link_router.post("/accept_invitation", status_code=status.HTTP_200_OK)
async def join_group_via_link(group_link: str, current_user=Depends(verify_user_token)):
    """
    Allows a user to join a savings group using a unique group link.
    """
    supabase_admin = get_supabase_admin()
    current_user_id = getattr(current_user, "id", None)

    if not current_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be signed in to join a savings group.",
        )

    # Fetch the group details using the provided group link
    try:
        group_response = (
            supabase_admin.table("savings_groups")
            .select("id, title, max_slots, status","contribution_amount","cycle_period")
            .eq("group_link", group_link)
            .maybe_single()
            .execute()
        )
        group = group_response.data
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

    # Check if the user is already a member of the group
    try:
        membership_response = (
            supabase_admin.table("group_members")
            .select("user_id")
            .eq("user_id", str(current_user_id))
            .eq("group_id", str(group["id"]))
            .maybe_single()
            .execute()
        )
        membership = membership_response.data
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking membership: {err}",
        )

    if membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this savings group.",
        )

    # Check if the group has available slots
    try:
        members_count_response = (
            supabase_admin.table("group_members")
            .select("user_id", count="exact")
            .eq("group_id", str(group["id"]))
            .execute()
        )
        members_count = members_count_response.count or 0
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error counting members: {err}",
        )

    if members_count >= group["max_slots"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This savings group is full.",
        )