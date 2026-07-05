import hashlib
import logging
import uuid

from fastapi import HTTPException, status

from app.supabase_client import get_supabase_admin
from models.fallback_schema import ManualFallbackContributionRequest

logger = logging.getLogger("Monicare.fallback_ledger")


async def process_manual_fallback_payment(user_uuid: str, payload: ManualFallbackContributionRequest) -> dict:
    """
    Executes a manual transfer from a user's wallet to a savings group
    to clear an overdue payment item after automated debits have failed.
    """
    supabase_admin = get_supabase_admin()
    schedule_id_str = str(payload.schedule_id)

    schedule_res = (
        supabase_admin.table("group_schedules")
        .select("group_id, amount_due, payment_status, cycle_round")
        .eq("id", schedule_id_str)
        .eq("user_id", user_uuid)
        .maybe_single()
        .execute()
    )
    schedule = schedule_res.data if schedule_res else None

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The targeted contribution schedule window was not found for your profile.",
        )

    if schedule.get("payment_status") == "PAID":
        return {"status": "success", "message": "This specific contribution round has already been fully settled."}

    group_id_str = schedule["group_id"]
    amount_due = float(schedule["amount_due"])
    cycle_round = schedule["cycle_round"]

    profile_res = (
        supabase_admin.table("profiles")
        .select("wallet_balance, transaction_pin_hash, is_pin_configured")
        .eq("id", user_uuid)
        .single()
        .execute()
    )
    profile = profile_res.data if profile_res else None

    if not profile or not profile.get("is_pin_configured"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must configure a transaction security PIN before executing ledger moves.",
        )

    input_pin_hash = hashlib.sha256(payload.transaction_pin.encode("utf-8")).hexdigest()
    if input_pin_hash != profile.get("transaction_pin_hash"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect transaction PIN. Access denied.")

    current_wallet = float(profile.get("wallet_balance", 0.0) or 0.0)
    if current_wallet < amount_due:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Your wallet balance (₦{current_wallet:,.2f}) is insufficient to cover this contribution. "
                f"Please top up ₦{amount_due - current_wallet:,.2f} using your Nomba virtual account code to proceed."
            ),
        )

    group_res = (
        supabase_admin.table("savings_groups")
        .select("title, current_total_saved, status")
        .eq("id", group_id_str)
        .single()
        .execute()
    )
    group = group_res.data if group_res else None

    if not group or group.get("status") != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contributions are locked because this savings group is currently not active.",
        )

    current_group_pool = float(group.get("current_total_saved", 0.0) or 0.0)

    try:
        new_wallet_balance = current_wallet - amount_due
        supabase_admin.table("profiles").update({"wallet_balance": new_wallet_balance}).eq("id", user_uuid).execute()

        new_group_total = current_group_pool + amount_due
        supabase_admin.table("savings_groups").update({"current_total_saved": new_group_total}).eq("id", group_id_str).execute()

        supabase_admin.table("group_schedules").update({
            "payment_status": "PAID",
        }).eq("id", schedule_id_str).execute()

        supabase_admin.table("group_contributions").insert({
            "group_id": group_id_str,
            "user_id": user_uuid,
            "amount": amount_due,
        }).execute()

        deterministic_txn_ref = f"FALLBACK_SG_R{cycle_round}_{uuid.uuid4().hex[:8].upper()}"
        supabase_admin.table("wallet_transactions").insert({
            "user_id": user_uuid,
            "amount": amount_due,
            "type": "DEBIT_TO_GROUP",
            "status": "SUCCESS",
            "nomba_transaction_ref": deterministic_txn_ref,
        }).execute()

        logger.info(
            "Manual fallback contribution processed successfully. User: %s, Group: %s, Round: %s",
            user_uuid,
            group_id_str,
            cycle_round,
        )

        return {
            "status": "success",
            "message": f"Successfully settled overdue ₦{amount_due:,.2f} contribution for Round {cycle_round} in '{group['title']}'.",
            "data": {
                "new_wallet_balance": new_wallet_balance,
                "group_total_saved": new_group_total,
                "transaction_reference": deterministic_txn_ref,
            },
        }
    except Exception as exec_err:
        logger.critical(
            "CRITICAL STATE MISALIGNMENT RISK: Manual fallback failed for user %s on schedule %s: %s",
            user_uuid,
            schedule_id_str,
            exec_err,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A critical error occurred while processing the ledger balance updates.",
        )
