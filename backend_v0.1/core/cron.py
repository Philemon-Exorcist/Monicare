import asyncio
import logging
import os
from typing import Any

import httpx

from api.get_historical_txn import sync_subaccount_transaction_history
from app.supabase_client import get_supabase_admin
from core.activate_group import activate_groups_by_max_slots

logger = logging.getLogger("Monicare.cron")

KEEP_ALIVE_URL = os.environ.get("KEEP_ALIVE_URL", "https://monicare.onrender.com/health")
KEEP_ALIVE_INTERVAL_SECONDS = int(os.environ.get("KEEP_ALIVE_INTERVAL_SECONDS", 600))
ENABLE_KEEP_ALIVE = os.environ.get("ENABLE_KEEP_ALIVE", "true").lower() in ("1", "true", "yes")

AUTO_ACTIVATE_INTERVAL_SECONDS = int(os.environ.get("AUTO_ACTIVATE_INTERVAL_SECONDS", 300))
ENABLE_AUTO_ACTIVATION = os.environ.get("ENABLE_AUTO_ACTIVATION", "true").lower() in ("1", "true", "yes")

GROUP_COLLECTION_INTERVAL_SECONDS = int(os.environ.get("GROUP_COLLECTION_INTERVAL_SECONDS", 300))
ENABLE_GROUP_COLLECTION_CRON = os.environ.get("ENABLE_GROUP_COLLECTION_CRON", "true").lower() in ("1", "true", "yes")

NOMBA_HISTORY_SYNC_INTERVAL_SECONDS = int(os.environ.get("NOMBA_HISTORY_SYNC_INTERVAL_SECONDS", 86400))
ENABLE_NOMBA_HISTORY_SYNC = os.environ.get("ENABLE_NOMBA_HISTORY_SYNC", "false").lower() in ("1", "true", "yes")
NOMBA_HISTORY_DAYS_BACK = int(os.environ.get("NOMBA_HISTORY_DAYS_BACK", 7))


async def keep_alive_loop() -> None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            try:
                response = await client.get(KEEP_ALIVE_URL)
                logger.info("Keepalive ping %s -> %s", KEEP_ALIVE_URL, response.status_code)
            except Exception as err:
                logger.warning("Keepalive ping failed: %s", err)
            await asyncio.sleep(KEEP_ALIVE_INTERVAL_SECONDS)


async def auto_activate_loop() -> None:
    while True:
        try:
            activated_ids = await activate_groups_by_max_slots()
            if activated_ids:
                logger.info("Auto-activated groups: %s", ", ".join(activated_ids))
        except Exception as err:
            logger.error("Auto-activation loop failed: %s", err, exc_info=True)
        await asyncio.sleep(AUTO_ACTIVATE_INTERVAL_SECONDS)


async def collect_due_group_contributions_once() -> list[str]:
    """
    Sweep the schedule table and collect due group contributions without user interaction.
    This is safe to run repeatedly because it writes deterministic ledger references.
    """
    supabase_admin = get_supabase_admin()
    processed_schedule_ids: list[str] = []

    try:
        schedules_response = (
            supabase_admin.table("group_schedules")
            .select("id, group_id, user_id, amount_due, payment_status, cycle_round")
            .in_("payment_status", ["PENDING", "DUE", "OVERDUE"])
            .execute()
        )
        schedules = schedules_response.data or []
    except Exception as err:
        logger.info("group_schedules not ready or query failed; skipping cron collection: %s", err)
        return processed_schedule_ids

    for schedule in schedules:
        schedule_id = schedule.get("id")
        group_id = schedule.get("group_id")
        user_id = schedule.get("user_id")
        amount_due = float(schedule.get("amount_due", 0.0) or 0.0)

        if not schedule_id or not group_id or not user_id or amount_due <= 0:
            continue

        payout_ref = f"AUTO_SG_{str(schedule_id).replace('-', '').upper()[:24]}"

        existing_txn = (
            supabase_admin.table("wallet_transactions")
            .select("nomba_transaction_ref")
            .eq("nomba_transaction_ref", payout_ref)
            .execute()
        )
        if existing_txn.data:
            continue

        profile_response = (
            supabase_admin.table("profiles")
            .select("wallet_balance")
            .eq("id", str(user_id))
            .single()
            .execute()
        )
        if not profile_response.data:
            logger.warning("Skipping schedule %s because profile %s is missing.", schedule_id, user_id)
            continue

        current_wallet = float(profile_response.data.get("wallet_balance", 0.0) or 0.0)
        if current_wallet < amount_due:
            logger.info(
                "Skipping schedule %s due to insufficient wallet balance for user %s.",
                schedule_id,
                user_id,
            )
            continue

        group_response = (
            supabase_admin.table("savings_groups")
            .select("group_name, current_total_saved, status")
            .eq("group_id", str(group_id))
            .maybe_single()
            .execute()
        )
        group = group_response.data if group_response else None
        if not group or group.get("status") != "ACTIVE":
            logger.info("Skipping schedule %s because group %s is not active.", schedule_id, group_id)
            continue

        try:
            new_wallet_balance = current_wallet - amount_due
            supabase_admin.table("profiles").update({"wallet_balance": new_wallet_balance}).eq("id", str(user_id)).execute()

            new_group_total = float(group.get("current_total_saved", 0.0) or 0.0) + amount_due
            supabase_admin.table("savings_groups").update({"current_total_saved": new_group_total}).eq("group_id", str(group_id)).execute()

            supabase_admin.table("group_contributions").insert({
                "group_id": str(group_id),
                "user_id": str(user_id),
                "amount": amount_due,
            }).execute()

            supabase_admin.table("wallet_transactions").insert({
                "user_id": str(user_id),
                "amount": amount_due,
                "nomba_transaction_ref": payout_ref,
                "reference": f"Auto-contribution for group {group_id}",
            }).execute()

            supabase_admin.table("group_schedules").update({
                "payment_status": "PAID",
            }).eq("id", str(schedule_id)).execute()

            processed_schedule_ids.append(str(schedule_id))
            logger.info(
                "Auto-collected group contribution schedule %s for user %s and group %s.",
                schedule_id,
                user_id,
                group_id,
            )
        except Exception as err:
            logger.error("Failed processing schedule %s: %s", schedule_id, err, exc_info=True)

    return processed_schedule_ids


async def collect_due_group_contributions_loop() -> None:
    while True:
        try:
            processed_ids = await collect_due_group_contributions_once()
            if processed_ids:
                logger.info("Auto-collected schedules: %s", ", ".join(processed_ids))
        except Exception as err:
            logger.error("Group collection cron failed: %s", err, exc_info=True)
        await asyncio.sleep(GROUP_COLLECTION_INTERVAL_SECONDS)


async def sync_nomba_history_loop() -> None:
    while True:
        try:
            await sync_subaccount_transaction_history(days_back=NOMBA_HISTORY_DAYS_BACK)
        except Exception as err:
            logger.error("Nomba history sync failed: %s", err, exc_info=True)
        await asyncio.sleep(NOMBA_HISTORY_SYNC_INTERVAL_SECONDS)


def register_background_tasks(app: Any) -> None:
    app.state.keepalive_task = None
    app.state.auto_activate_task = None
    app.state.group_collection_task = None
    app.state.nomba_history_sync_task = None


async def start_background_tasks(app: Any) -> None:
    if ENABLE_KEEP_ALIVE:
        logger.info("Keepalive enabled. Pinging %s every %s seconds.", KEEP_ALIVE_URL, KEEP_ALIVE_INTERVAL_SECONDS)
        app.state.keepalive_task = asyncio.create_task(keep_alive_loop())

    if ENABLE_AUTO_ACTIVATION:
        logger.info("Auto-activation enabled. Polling every %s seconds.", AUTO_ACTIVATE_INTERVAL_SECONDS)
        app.state.auto_activate_task = asyncio.create_task(auto_activate_loop())

    if ENABLE_GROUP_COLLECTION_CRON:
        logger.info(
            "Group collection cron enabled. Polling every %s seconds.",
            GROUP_COLLECTION_INTERVAL_SECONDS,
        )
        app.state.group_collection_task = asyncio.create_task(collect_due_group_contributions_loop())

    if ENABLE_NOMBA_HISTORY_SYNC:
        logger.info(
            "Nomba history sync enabled. Running every %s seconds for the last %s days.",
            NOMBA_HISTORY_SYNC_INTERVAL_SECONDS,
            NOMBA_HISTORY_DAYS_BACK,
        )
        app.state.nomba_history_sync_task = asyncio.create_task(sync_nomba_history_loop())


async def stop_background_tasks(app: Any) -> None:
    for task_name in ("keepalive_task", "auto_activate_task", "group_collection_task", "nomba_history_sync_task"):
        task = getattr(app.state, task_name, None)
        if task is not None:
            task.cancel()
