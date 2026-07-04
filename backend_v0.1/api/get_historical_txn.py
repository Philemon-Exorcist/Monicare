

import asyncio
import logging
from datetime import datetime, timedelta
import httpx
from integrations.nomba_client import NombaAPIClient
from app.supabase_client import get_supabase_admin

logger = logging.getLogger("Monicare.history_sync")


async def sync_subaccount_transaction_history(days_back: int = 7):
    """
    Polls historical transactions from Nomba for the configured sub-account
    and syncs unrecorded payments safely into the Supabase database.
    """
    nomba_client = NombaAPIClient()
    supabase_admin = get_supabase_admin()

    # 1. Establish your query timeframe window boundaries
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=days_back)

    # Format matching Nomba's standard ISO timestamp parsing expectations
    from_date_str = start_time.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    to_date_str = end_time.strftime("%Y-%m-%dT%H:%M:%S.000Z")

    # 2. Authenticate token proxy layers
    token = await nomba_client._get_oauth_token()

    url = f"{nomba_client.base_url}/v1/transactions/accounts/sub-account"
    headers = {
        "Authorization": f"Bearer {token}",
        "accountId": nomba_client.parent_account_id,
        "Content-Type": "application/json",
    }

    # Query fields filtering for your specific sub-account profile container
    payload = {
        "subAccountId": nomba_client.sub_account_id,
        "fromDateTime": from_date_str,
        "toDateTime": to_date_str,
        "page": 0,
        "size": 50,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            res_data = response.json()

            if res_data.get("code") != "00":
                logger.error(
                    "Failed to fetch past history from Nomba: %s",
                    res_data.get("description"),
                )
                return

            transactions_list = res_data.get("data", {}).get("content", [])
            logger.info(
                "Retrieved %d transactions from Nomba history ledger.",
                len(transactions_list),
            )

            # 3. Iterate through historical records and reconcile rows
            for txn in transactions_list:
                # Filter specifically for successful incoming credits
                if (
                    txn.get("status") != "SUCCESS"
                    or txn.get("transactionType") != "CREDIT"
                ):
                    continue

                network_ref = txn.get("orderReference")
                account_ref = txn.get("accountRef")  # e.g., "USER_REF_uuid"
                amount_deposited = float(txn.get("amount", 0.0))

                if not account_ref or "USER_REF_" not in account_ref:
                    continue

                user_uuid = account_ref.replace("USER_REF_", "")

                # 4. Idempotency Check: Verify if it already exists in Supabase
                existing_txn = (
                    supabase_admin.table("wallet_transactions")
                    .select("id")
                    .eq("nomba_transaction_ref", network_ref)
                    .execute()
                )

                if existing_txn.data:
                    # Skip to prevent double-crediting historical records
                    continue

                logger.info(
                    "Found missing past transaction %s. Synchronizing...",
                    network_ref,
                )

                # 5. Atomic Update Execution Flow
                # A. Fetch balance profile
                profile_res = (
                    supabase_admin.table("profiles")
                    .select("wallet_balance")
                    .eq("id", user_uuid)
                    .single()
                    .execute()
                )

                if not profile_res.data:
                    logger.warning(
                        "Skipping history sync. User profile missing: %s",
                        user_uuid,
                    )
                    continue

                current_balance = float(
                    profile_res.data.get("wallet_balance", 0.0) or 0.0
                )
                new_balance = current_balance + amount_deposited

                # B. Commit database updates atomically
                supabase_admin.table("profiles").update(
                    {"wallet_balance": new_balance}
                ).eq("id", user_uuid).execute()

                # C. Save the transaction log to history records
                supabase_admin.table("wallet_transactions").insert(
                    {
                        "user_id": user_uuid,
                        "amount": amount_deposited,
                        "type": "TOPUP",
                        "status": "SUCCESS",
                        "nomba_transaction_ref": network_ref,
                    }
                ).execute()

                logger.info(
                    "Successfully restored and credited past txn: %s to user %s",
                    network_ref,
                    user_uuid,
                )

        except Exception as err:
            logger.error("Failed executing past history syncing cron: %s", err)


# Execution loop target hook
if __name__ == "__main__":
    asyncio.run(sync_subaccount_transaction_history(days_back=30))
