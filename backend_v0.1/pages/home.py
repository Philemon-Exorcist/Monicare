import logging

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import verify_user_token
from app.supabase_client import get_supabase_admin

home_router = APIRouter(prefix="/api/v1", tags=["Home"])
logger = logging.getLogger("Monicare.home")


class AutoDebitPreference(BaseModel):
    enabled: bool = Field(..., description="Whether auto debit from the virtual account is enabled.")


@home_router.get("/dashboard", status_code=status.HTTP_200_OK)
async def home(current_user=Depends(verify_user_token)):
    current_user_id = getattr(current_user, "id", None)
    logger.info("User %s accessed the home endpoint.", current_user_id)

    if not current_user_id:
        return {
            "status": "error",
            "message": "Missing user identity.",
        }

    supabase_admin = get_supabase_admin()

    # Fetch core profile fields including wallet balance
    try:
        profile_response = (
            supabase_admin.table("profiles")
            .select("first_name,last_name,nomba_bank_name,nomba_virtual_account,wallet_balance,auto_debit_enabled")
            .eq("id", current_user_id)
            .maybe_single()
            .execute()
        )
        profile = profile_response.data or {}
    except Exception as err:
        logger.error("Profile lookup failed for /home: %s", err, exc_info=True)
        profile = {}

    first_name = (profile.get("first_name") or getattr(current_user, "first_name", "") or "").strip()
    last_name = (profile.get("last_name") or getattr(current_user, "last_name", "") or "").strip()
    account_name = " ".join(part for part in [first_name, last_name] if part).strip()
    bank_name = profile.get("nomba_bank_name") or "UNKNOWN"
    account_number = profile.get("nomba_virtual_account") or "UNKNOWN"
    wallet_balance = float(profile.get("wallet_balance") or 0.0)
    auto_debit_enabled = bool(profile.get("auto_debit_enabled") or False)

    # Fetch groups the user belongs to, ordered by rotation_position
    try:
        memberships_resp = (
            supabase_admin.table("group_members")
            .select("group_id,slot_position,joined_at")
            .eq("user_id", str(current_user_id))
            .order("slot_position", desc=False)
            .execute()
        )
        memberships = memberships_resp.data or []
        group_ids = [row["group_id"] for row in memberships if row.get("group_id")]
    except Exception as err:
        logger.error("Failed to load group memberships for %s: %s", current_user_id, err, exc_info=True)
        memberships = []
        group_ids = []

    groups = []
    if group_ids:
        try:
            groups_resp = (
                supabase_admin.table("savings_groups")
                .select(
                    "group_id,title,contribution_amount,cycle_period,max_slots,status,current_cycle_round,nomba_sub_account_id,creator_id,group_link,activated_at,created_at"
                )
                .in_("group_id", group_ids)
                .execute()
            )
            groups_data = groups_resp.data or []
        except Exception as err:
            logger.error("Failed to load savings groups for %s: %s", current_user_id, err, exc_info=True)
            groups_data = []

        groups_by_id = {str(g["group_id"]): g for g in groups_data if g.get("group_id")}
        membership_by_group = {str(row["group_id"]): row for row in memberships if row.get("group_id")}

        # Preserve order by rotation_position from memberships
        sorted_memberships = sorted(memberships, key=lambda r: (r.get("slot_position") or 0))
        for m in sorted_memberships:
            gid = str(m.get("group_id"))
            g = groups_by_id.get(gid)
            if not g:
                continue

            groups.append({
                "group_id": g.get("group_id"),
                "group_name": g.get("title"),
                "title": g.get("title"),
                "contribution_amount": float(g.get("contribution_amount") or 0.0),
                "cycle_period": g.get("cycle_period"),
                "max_slots": g.get("max_slots"),
                "status": g.get("status"),
                "current_cycle_round": g.get("current_cycle_round"),
                "nomba_sub_account_id": g.get("nomba_sub_account_id"),
                "creator_id": g.get("creator_id"),
                "group_link": g.get("group_link"),
                "activated_at": g.get("activated_at"),
                "created_at": g.get("created_at"),
                "joined_at": membership_by_group.get(gid, {}).get("joined_at"),
                "slot_position": membership_by_group.get(gid, {}).get("slot_position"),
            })

    return {
        "status": "success",
        "message": "Home profile loaded successfully.",
        "data": {
            "first_name": first_name,
            "last_name": last_name,
            "account_name": account_name,
            "bank_name": bank_name,
            "account_number": account_number,
            "wallet_balance": wallet_balance,
            "auto_debit_enabled": auto_debit_enabled,
            "groups": groups,
        },
    }


@home_router.patch("/profile/auto-debit", status_code=status.HTTP_200_OK)
async def set_auto_debit_preference(
    payload: AutoDebitPreference,
    current_user=Depends(verify_user_token),
):
    current_user_id = getattr(current_user, "id", None)

    if not current_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing user identity.",
        )

    supabase_admin = get_supabase_admin()

    try:
        response = (
            supabase_admin.table("profiles")
            .update({"auto_debit_enabled": payload.enabled})
            .eq("id", current_user_id)
            .select("auto_debit_enabled")
            .execute()
        )
        updated = (response.data or [{}])[0]
    except Exception as err:
        logger.error("Failed to update auto debit preference for %s: %s", current_user_id, err, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update auto debit preference right now.",
        )

    return {
        "status": "success",
        "message": f"Auto debit has been {'enabled' if payload.enabled else 'disabled'}.",
        "data": {
            "auto_debit_enabled": bool(updated.get("auto_debit_enabled") if isinstance(updated, dict) else payload.enabled),
        },
    }


# need to add slot position and if auto debit is authorized (true) and this is for my active circles section on the home page ,
#  add group scheduler to database, from chrome chat, is the activate dependent on the cron scheduler
