# Backend Progress — 2026-07-03

## Summary
- **Workspace:** backend_v0.1
- **Scope:** backend-only progress and outstanding issues related to Nomba integration and webhooks.

## Completed (backend)
- **Webhook handler rewritten:** Replaced duplicate/fragmented implementations with a single robust handler at `api/webhook.py`. It now:
  - Verifies HMAC signatures (`nomba-signature`, `x-nomba-signature`, `x-signature`).
  - Validates payload against `models/webhook_schema.py`.
  - Offloads DB updates via `BackgroundTasks` to avoid blocking the webhook response.
  - Implements idempotency checks against `wallet_transactions` to avoid double-crediting.
- **Schema fixes:** Cleaned and consolidated `models/webhook_schema.py` to a single canonical Pydantic schema for Nomba events.
- **Nomba settings:** Made `NOMBA_WEBHOOK_SECRET` optional in `models/nomba_schema.py` to avoid app startup crashes when the env var is missing. Secret validation now occurs at webhook request time with a clear 500 error if not configured.
- **Group link helper:** Added `core/generate_group_link.py` which builds stable invite URLs (uses `GROUP_LINK_BASE_URL` or falls back to the default frontend URL).

## Outstanding / Known Issues
- **Nomba virtual account provisioning:** We have intermittent issues with creating virtual accounts via Nomba's API (token/credentials and business logic rejections). Work remains to harden token acquisition and error handling in `integrations/nomba_client.py`.
- **Webhook URL & signing:** Webhook endpoint exists, but production requires the `NOMBA_WEBHOOK_SECRET` environment variable to be set. Until set and end-to-end tested with Nomba-signed payloads, retries and delivery behavior are unverified.
- **Router registration:** The `api/webhook.py` router was implemented, but ensure it is included in `main.py` using `app.include_router(...)` so the route is active in deployments.
- **Group link persistence:** `create_savings_group.py` currently creates groups and inserts the creator into `group_members` but does not generate or persist the shareable `group_link`. Add a DB column (e.g., `group_link`) and call `generate_group_link()` after insert, then save it.
- **Cycle period enum mismatch:** `models/group_saving_schema.py` lists `DAILY|WEEKLY|MONTHLY` while DB enum in `database/supabase_db.sql` is `WEEKLY|BI_WEEKLY|MONTHLY`. Align these to prevent insert-time errors.

## Next Steps (recommended)
1. Add `group_link` column to `savings_groups` and persist generated link after group creation.
2. Register `api/webhook.py` router in `main.py` (and `pages/home.py` router if not already included).
3. Reconcile `cycle_period` enum between Pydantic model and DB.
4. Harden `integrations/nomba_client.py` token retrieval and handle non-00 business responses robustly.
5. Set `NOMBA_WEBHOOK_SECRET` in staging/production and run end-to-end webhook tests with signed payloads.

## Files changed (backend)
- `api/webhook.py` — replaced with single robust implementation
- `models/webhook_schema.py` — consolidated schema
- `models/nomba_schema.py` — `NOMBA_WEBHOOK_SECRET` made optional
- `core/generate_group_link.py` — new helper



