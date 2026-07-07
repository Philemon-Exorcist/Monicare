import logging
import uuid
from uuid import UUID

from fastapi import HTTPException, status

from app.supabase_client import get_supabase_admin
from models.fallback_schema import ManualFallbackContributionRequest

logger = logging.getLogger("Monicare.group_savings")


async def execute_group_contribution(user_uuid: str, payload: ManualFallbackContributionRequest) -> dict:
    """
    Manually move funds from a user's wallet to settle a specific, scheduled contribution.
    This is intended for users who want to pay before the automatic cron job runs.
    """
    supabase_admin = get_supabase_admin()

    try:
        schedule_id = str(payload.schedule_id)
        UUID(schedule_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="A valid schedule ID is required."
        )

    try:
        profile_res = (
            supabase_admin.table("profiles")
            .select("wallet_balance")
            .eq("id", user_uuid)
            .single()
            .execute()
        )
        profile = profile_res.data if profile_res else None
    except Exception as err:
        logger.error("Failed to fetch profile for user %s: %s", user_uuid, err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving wallet balance records.",
        )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account profile not found on the platform.",
        )

    # 1. Fetch the specific schedule to be paid
    try:
        schedule_res = (
            supabase_admin.table("group_schedules")
            .select("id, group_id, user_id, amount_due, payment_status, cycle_round")
            .eq("id", schedule_id)
            .eq("user_id", user_uuid)  # Ensure the user owns this schedule
            .maybe_single()
            .execute()
        )
        schedule = schedule_res.data
    except Exception as err:
        logger.error("Failed to fetch group schedule %s: %s", schedule_id, err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving contribution schedule.",
        )

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contribution schedule not found or you do not have permission to pay it.",
        )

    if schedule.get("payment_status") == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="This contribution has already been paid."
        )

    contribution_amount = float(schedule.get("amount_due", 0.0) or 0.0)
    group_id_str = str(schedule.get("group_id"))

    current_wallet = float(profile.get("wallet_balance", 0.0) or 0.0)
    if current_wallet < contribution_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient wallet balance. You need ₦{contribution_amount - current_wallet:.2f} "
                "more to complete this action."
            ),
        )

    try:
        group_res = (
            supabase_admin.table("savings_groups")
            .select("group_id, group_name, contribution_amount, current_cycle_round, status, current_total_saved")
            .eq("group_id", group_id_str)
            .maybe_single()
            .execute()
        )
        group = group_res.data if group_res else None
    except Exception as err:
        logger.error("Failed to fetch savings group %s: %s", group_id_str, err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error querying target savings group state.",
        )

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The savings group you are trying to contribute to does not exist.",
        )

    if group.get("status") != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contributions are blocked because this savings group is currently not active.",
        )

    current_group_pool = float(group.get("current_total_saved", 0.0) or 0.0)

    try:
        # This block should be wrapped in a database transaction
        # For Supabase (Postgres), you would use a custom RPC function (e.g., "process_manual_contribution")
        # to ensure all the following operations are atomic.

        # Step 1: Debit user's wallet
        new_wallet_balance = current_wallet - contribution_amount
        supabase_admin.table("profiles").update({"wallet_balance": new_wallet_balance}).eq("id", user_uuid).execute()

        # Step 2: Credit group's total
        new_group_total = current_group_pool + contribution_amount
        supabase_admin.table("savings_groups").update({"current_total_saved": new_group_total}).eq("group_id", group_id_str).execute()

        # Step 3: Log the successful contribution
        supabase_admin.table("group_contributions").insert({
            "group_id": group_id_str,
            "user_id": user_uuid,
            "amount": contribution_amount,
        }).execute()

        # Step 4: Create a wallet transaction record
        deterministic_txn_ref = f"INT_SG_{uuid.uuid4().hex[:12].upper()}"
        supabase_admin.table("wallet_transactions").insert({
            "user_id": user_uuid,
            "amount": contribution_amount,
            "nomba_transaction_ref": deterministic_txn_ref,
            "reference": f"Manual contribution for group {group_id_str}",
        }).execute()

        # Step 5: Mark the schedule as PAID
        supabase_admin.table("group_schedules").update({"payment_status": "PAID"}).eq(
            "id", schedule_id
        ).execute()

        logger.info(
            "Successful internal group contribution: user=%s group=%s amount=%s",
            user_uuid,
            group_id_str,
            contribution_amount,
        )

        return {
            "status": "success",
            "message": f"Successfully contributed ₦{contribution_amount:,.2f} to '{group['title']}'.",
            "data": {
                "new_wallet_balance": new_wallet_balance,
                "group_total_saved": new_group_total,
                "transaction_reference": deterministic_txn_ref,
            },
        }

    except HTTPException:
        raise
    except Exception as exec_err:
        logger.critical(
            "Ledger misalignment risk for user %s to group %s: %s",
            user_uuid,
            group_id_str,
            exec_err,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Critical ledger balance synchronization error occurred.",
        )
