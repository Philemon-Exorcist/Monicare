# Monicare Product Requirements Document

**Status:** Draft based on the repository as inspected  
**Product:** Monicare  
**Primary market/currency indicated by the code:** Nigeria / NGN  
**Scope:** Product overview and a proposed replacement of Nomba payment operations with Paystack

## 1. Product overview

Monicare is a digital savings-circle product built to enable trust through clarity, shared expectations, and transparent records. It is intended to let people save together in rotating groups: members join a circle, agree on a contribution amount and schedule, choose or receive a payout position, contribute each cycle, and take turns receiving the pooled contribution. The product also models a personal wallet so members can fund their account, pay contributions from their available balance, and withdraw funds to a bank account.

The repository contains:

- A Next.js/React web app with login, a personal dashboard, savings-circle creation and joining, group details, contribution history, notifications, account settings, and a withdrawal screen.
- A FastAPI backend that handles Supabase authentication/profile data, savings groups and schedules, wallet transactions, background collection and payout processing, and payment-provider requests.
- Supabase/Postgres as the application's data store. User wallet balances, group totals, schedules, contributions, and payment records are represented in application tables.
- Nomba integration code for user virtual-account provisioning, inbound-payment webhooks, bank-account lookup, outgoing transfers, account balance and transaction queries, and optional transaction-history reconciliation.

This PRD describes the intended product and a target Paystack solution. It is not a claim that every described flow is already production-ready: the inspected code includes incomplete, inconsistent, and non-atomic payment/ledger paths.

## 2. Problem and product vision

People who participate in informal rotating savings groups need a shared, understandable way to organize membership, contribution obligations, payout order, and payment records. Monicare aims to make these circles easier to create and operate while providing members with a personal view of their available funds and group activity.

**Vision:** Enable trust in community savings circles by helping every member understand the agreement, see their obligations and payout position, and distinguish a pending payment from a confirmed one.

## 3. Users

### Circle organizer

- Creates a circle and defines its name, contribution amount, cycle period, member capacity, rules, and payout order.
- Invites members and monitors membership and collection progress.
- Needs confidence that a circle will not advance or pay out before the relevant cycle is funded.

### Circle member

- Creates an account, joins a circle, selects or confirms a payout position, and reviews schedules and history.
- Funds their Monicare balance and settles contributions.
- Needs clear payment status, reliable receipts, and a way to withdraw eligible funds.

### Monicare operations/support

- Monitors funding, withdrawals, provider webhooks, exceptions, and reconciliation.
- Needs traceable provider references, safe retry behavior, and a way to resolve stuck or disputed transactions.

## 4. Product goals

1. Make it straightforward to register, create a circle, invite members, and join a circle.
2. Give each member an accurate view of their personal balance, circle obligations, payout position, and transaction history.
3. Accept and record wallet funding reliably.
4. Record contributions and group-cycle payouts without duplicate or lost ledger entries.
5. Support verified bank-account withdrawals with clear pending, successful, failed, and reversed states.
6. Replace Nomba-specific payment operations with Paystack where the required Paystack products and account permissions are available.
7. Keep payment-provider activity and Monicare's own savings-circle ledger distinct and reconcilable.

## 5. Out of scope for this migration

- Replacing Supabase authentication, the Next.js frontend framework, or the savings-circle product model.
- Treating a Paystack subaccount as a savings-circle escrow account or as a personal wallet without separately validating that product and operating model.
- Assuming Paystack will automatically debit a user's bank account because Monicare has assigned them a dedicated virtual account.
- Migrating historical Nomba transaction records by recreating them at Paystack. Existing records remain historical Monicare ledger entries.
- Launching or expanding a regulated stored-value/wallet product without the necessary provider, legal, compliance, and operational approvals.

## 6. Current product surfaces found in the repository

| Surface | Current behavior represented in code |
|---|---|
| Authentication and profile | Supabase-backed signup and login, with profile details stored in `profiles`. Signup currently attempts to provision a Nomba virtual account. |
| Personal dashboard | Displays a wallet balance, savings-circle summary, and virtual funding-account details. |
| Circle setup and membership | APIs and UI for creating groups, joining by link, member slots, cycle schedules, and group details. |
| Contributions | Manual and scheduled code paths debit the Monicare wallet ledger and update group contribution records. |
| Rotating payouts | A background worker checks paid schedules, credits the next recipient's Monicare wallet balance, and advances the cycle. This is an internal ledger credit, not a bank transfer. |
| Wallet funding | Nomba virtual accounts are provisioned for users; the Nomba webhook handler intends to credit the matching Monicare wallet after a successful inbound payment. |
| Withdrawals | The API validates a transaction PIN, resolves bank-account details, debits the wallet, and calls Nomba to transfer to a bank. |
| Settings | An auto-debit preference exists. The current collection worker uses available Monicare wallet balance; it does not implement a direct debit from a user's bank account. |
| Reconciliation | An optional Nomba transaction-history sync attempts to find missing inbound payments. |

### Important implementation caveats

- Some backend SQL/schema fields, model fields, and queries use different names (for example, group IDs/totals and Nomba references). These must be reconciled before relying on payment migration tests.
- Current wallet/group balance changes are often a sequence of separate database writes rather than one atomic transaction. A failure partway through can leave the ledger inconsistent.
- The withdrawal implementation currently marks a transfer successful immediately after the provider request returns and restores funds on request exceptions. A provider may accept a transfer asynchronously or return an ambiguous timeout; provider acceptance must not be equated with final settlement.
- The webhook handler's idempotency check and balance update are not protected as one atomic operation.
- The frontend and backend should be reviewed together for API paths, payloads, and status expectations during the migration.
- The settings copy says auto-debit from a virtual account, but code behavior is wallet-balance collection. Product wording and behavior should be aligned.

## 7. Core user journeys

### 7.1 Create and join a savings circle

1. An authenticated organizer creates a circle with contribution amount, cadence, maximum members, and payout rules.
2. Monicare creates a group, assigns the organizer's member slot, and provides a shareable invite link.
3. Invitees review the circle details and join, subject to available member slots.
4. Members confirm their payout positions and see the schedule and rules.
5. The circle becomes active when its activation criteria are met.

### 7.2 Fund a personal Monicare balance

1. The member sees their funding instructions or initiates an online payment.
2. Monicare creates or looks up a Paystack funding destination/transaction tied to the authenticated member and a unique Monicare reference.
3. Paystack confirms payment by a signed webhook. Monicare validates the payment and links it to the correct member and reference.
4. A single atomic ledger operation records the provider transaction and credits the member's available balance.
5. The dashboard and transaction history show the confirmed amount and status.

The target funding UX should preserve a dedicated bank-account option only if Monicare's Paystack account has the relevant dedicated virtual-account product enabled and the assigned account can be used for this flow. Otherwise, use a Paystack-hosted/redirect checkout as the supported funding path rather than displaying a placeholder account.

### 7.3 Pay a circle contribution

1. Monicare creates a contribution schedule for a member and cycle.
2. The member pays manually from their Monicare balance, or an enabled scheduled collection uses that available balance.
3. Monicare atomically debits the member ledger, records the contribution, and marks the schedule paid.
4. The cycle can proceed only when its configured funding criteria are met.

This is an internal ledger transfer in the current product model. Paystack is needed only when money enters or exits the provider boundary; a provider API call is not required for every internal contribution.

### 7.4 Receive a circle payout

1. Monicare confirms every required contribution for the cycle.
2. The payout rule determines the eligible member.
3. Monicare posts a single, traceable group-payout credit to that member's Monicare balance and advances the circle.
4. The member may later withdraw available funds to a verified bank account.

This describes the current internal-wallet design. If circle payouts are instead required to go directly to a bank, that is a product and funds-flow decision: the system must initiate a Paystack transfer and wait for a final provider result before marking the payout complete or advancing the cycle.

### 7.5 Withdraw to a bank account

1. The member selects a bank and enters an account number and amount.
2. Monicare resolves the account name through Paystack and asks the member to confirm the recipient.
3. Monicare validates available balance and transaction authorization, creates a pending withdrawal, and reserves/debits funds atomically.
4. Monicare creates a Paystack transfer recipient and initiates a transfer with a unique idempotency reference.
5. Signed Paystack transfer events and, where necessary, an API verification/reconciliation confirm final status.
6. Monicare marks the withdrawal successful, failed, or reversed. It releases/reserves funds according to the final state, exactly once.

## 8. Functional requirements

### FR-1: Accounts and identity

- Users can register and authenticate through the existing Supabase-backed flow.
- The backend associates each payment destination and transaction with a Monicare user using server-controlled identifiers and references.
- BVN/NIN and other personal data are collected only where required by an enabled product, applicable policy, and approved onboarding flow; never expose these values in payment-provider logs or client responses unnecessarily.

### FR-2: Funding

- A signed-in member can fund their Monicare balance using the configured Paystack funding method.
- Every payment attempt has a unique Monicare reference and an explicit pending/success/failed/reversed state.
- The client cannot directly set a wallet balance or claim that a payment succeeded.
- Duplicate webhook deliveries and repeated verification requests cannot create duplicate credits.
- Crediting checks user mapping, provider reference, final success state, currency, and expected amount before changing the ledger.
- Funding can be reconciled against Paystack transaction records and Monicare ledger records.

### FR-3: Savings circles

- An organizer can create a circle and invite members.
- Members can join, review contribution obligations, and see payout position and cycle status.
- A schedule is uniquely identifiable and can be paid only once.
- Circle activation, cycle completion, and payout eligibility are determined by explicit rules and persisted states, not by frontend state.

### FR-4: Contributions and internal ledger

- Contributions from a Monicare wallet are recorded as internal ledger movements.
- Each operation that changes balances and transaction/schedule state is atomic at the database layer.
- Repeated worker runs do not duplicate debits, contributions, or schedule completion.
- Insufficient balance, inactive circles, and already-settled schedules are explicit outcomes.

### FR-5: Withdrawals and bank details

- The backend can retrieve supported banks and resolve account names through Paystack where enabled.
- The member confirms the resolved account name before transfer execution.
- A withdrawal is not shown as complete just because Paystack accepted the request.
- Pending transfers remain pending until a verified final result arrives or reconciliation resolves the state.
- Failures, reversals, unknown transfer outcomes, and duplicate callbacks are handled without double debit or double refund.
- Paystack transfer functionality, account balance, limits, fees, authorization requirements, and destination-bank coverage must be confirmed for the Monicare account before release.

### FR-6: Webhooks and reconciliation

- Webhook signatures are verified using Paystack's documented method against the unmodified raw request body and the secret held server-side.
- Unsupported, malformed, duplicate, and invalid-signature events are safely rejected or acknowledged according to event processing policy.
- Webhook processing is idempotent and persisted before returning a success acknowledgment.
- Periodic reconciliation can find provider transactions that were missed by webhook delivery and compare them against the Monicare ledger.
- Webhook secrets and API secret keys are never exposed to the frontend or committed to source control.

### FR-7: User experience and support

- The dashboard shows balances from the authoritative Monicare ledger and distinguishes available, pending, and unavailable funds when applicable.
- Funding instructions always reflect a live assigned Paystack account or an available checkout flow; no synthetic/default account number is presented as real.
- Contribution and withdrawal status copy matches actual backend state.
- Support staff can search by Monicare transaction reference and provider reference and inspect status history without modifying provider records.

## 9. Non-functional requirements

- **Correctness:** Financial operations use decimal/minor-unit amounts, not binary floating-point calculations.
- **Atomicity:** Balance, ledger, schedule, and transaction state changes that form one operation commit or roll back together.
- **Idempotency:** Client retries, worker retries, and provider webhook retries cannot move funds more than once.
- **Auditability:** Each external movement records provider, provider reference, Monicare reference, amount, currency, actor/source, timestamps, and state transitions.
- **Security:** Provider credentials remain server-only; bank details and identity data are access-controlled and minimized in logs.
- **Availability:** Temporary provider errors leave a recoverable pending/failed state and do not silently report success.
- **Reconciliation:** Daily operations can compare Paystack transaction/transfer data with the Monicare ledger and surface exceptions.
- **Observability:** Logs and alerts identify webhook verification failures, unmatched events, stuck pending transactions, failed transfers, and reconciliation differences without logging secrets.
- **Compatibility:** A migration preserves existing Nomba-backed account details and transaction history for reference while moving new payment activity to the selected provider.

## 10. Nomba responsibilities and Paystack replacement map

| Nomba responsibility found in code | Monicare use | Proposed Paystack approach | Replacement caveat |
|---|---|---|---|
| OAuth token and authenticated API requests | `NombaAPIClient` obtains and caches Nomba tokens. | Use Paystack secret-key API authentication from the backend, through an isolated provider client. Store test/live keys in deployment secrets. | Paystack's authentication model is different; do not port Nomba token code or headers. |
| Per-user virtual account provisioning | Signup creates a user-specific Nomba virtual account and saves its number/bank/reference. | Use Paystack Dedicated Virtual Account/Dedicated NUBAN APIs if enabled for the Monicare merchant account; associate the assigned account with a Paystack customer and Monicare user. | Product eligibility, supported banks, onboarding requirements, and account behavior must be confirmed with Paystack first. A Paystack checkout is the fallback if this product is unavailable. |
| Inbound payment notification | Nomba webhook maps successful deposits to a profile and credits the wallet. | Consume Paystack's applicable successful-payment or dedicated-account event; verify the signature and transaction details, then post one atomic wallet credit. | Determine exact event names and payload fields from the enabled Paystack product and test account; do not carry over Nomba schemas or signature code. |
| Webhook authentication | Nomba-specific reconstructed signature is checked. | Verify Paystack's `x-paystack-signature` according to Paystack's current webhook documentation, using the raw body and merchant secret with constant-time comparison. | Signature algorithm and payload are provider-specific; the current handler must be replaced, not renamed. |
| Bank list and account-name lookup | Nomba bank lookup validates a withdrawal beneficiary. | Use Paystack's supported-bank listing and account-resolution endpoints, then persist the confirmed recipient details. | Confirm coverage and exact supported bank codes/response format in the merchant's market. |
| Bank transfer / payout | Withdrawal calls Nomba transfer API. | Create a Paystack transfer recipient, initiate the transfer with a unique reference, and finalize from verified transfer events/API status. | Paystack Transfers must be enabled and adequately funded/authorized. API acceptance is not proof of final settlement. |
| Subaccount / group vault | Group creation stores a configured Nomba subaccount ID; balance code queries its balance. | Keep circle balances in Monicare's own ledger. Use Paystack settlement/account data for reconciliation; use Paystack subaccounts only if a separately justified split-payment use case exists. | Paystack subaccounts are not an automatic equivalent of Nomba subaccount wallets or per-circle escrow balances. |
| Provider balance query | Nomba API exposes a configured subaccount balance. | Query the applicable Paystack merchant balance where available and reconcile it to obligations/settlements. | A merchant-level provider balance is not the same thing as each user's or circle's Monicare ledger balance. |
| Transaction lookup and history synchronization | Nomba transaction detail/history endpoints help reconcile deposits. | Use Paystack transaction verification/listing APIs as a recovery/reconciliation path, with webhooks as the normal event path. | Reconciliation must be paginated, time-bounded, and idempotent. Do not use it to blindly credit every provider row. |
| Provider reference and database naming | `nomba_*` profile, group, and transaction fields carry provider-specific values. | Add provider-neutral fields such as `payment_provider`, `provider_customer_code`, `funding_account_number`, `funding_bank_name`, and `provider_reference`; retain old Nomba values for history. | Backfill and stage the schema before switching traffic; keep uniqueness constraints on canonical provider references. |
| Auto-debit / recurring collection | UI suggests auto-debit from a virtual account; current cron actually debits existing Monicare balance. | Keep automatic contribution settlement from available Monicare balance as an internal operation. If direct card/bank debits are desired, design them separately using a Paystack-supported authorization/charge flow and explicit customer consent. | A dedicated virtual account is a way to receive transfers; it does not, by itself, authorize Monicare to pull funds from that account. |

## 11. Proposed solution approach

### Phase 0: Confirm Paystack capability and funds flow

Before changing production payment paths:

1. Confirm the Monicare Paystack merchant account and country/currency configuration.
2. Obtain written/visible confirmation that the account can use the required dedicated virtual account product and Transfers, including recipient resolution, limits, settlement timing, supported banks, and any authorization requirements.
3. Confirm with Paystack and relevant compliance/legal reviewers that Monicare's proposed personal wallet and rotating group funds flow is permitted under the merchant's account and applicable requirements.
4. Decide the customer experience if dedicated accounts are unavailable: hosted checkout, and whether direct-to-bank circle payouts are in scope.
5. Create Paystack test-mode credentials, webhook endpoint configuration, and test users. Never put live credentials in local examples or source.

**Gate:** Do not promise a Paystack funding account or bank withdrawal until each capability is enabled and verified in the actual Monicare account.

### Phase 1: Make the Monicare ledger provider-neutral and reliable

1. Add canonical provider fields and a provider-neutral external-payment record/table. Keep historical Nomba identifiers and preserve existing transaction references.
2. Add database uniqueness constraints for provider + provider reference and Monicare idempotency keys.
3. Implement database RPC/transactions for wallet credit, wallet reservation/debit/refund, contribution settlement, group payout, and cycle advancement.
4. Use integer minor units or fixed-precision decimal money types consistently; remove float balance calculations from money paths.
5. Define explicit transaction states and transition rules, including pending, succeeded, failed, and reversed.
6. Add audit records for state transitions and reconciliation exceptions.

This foundation is required regardless of whether Nomba or Paystack performs the external payment.

### Phase 2: Add a Paystack provider adapter

Create a Paystack client in the backend with focused operations for the enabled product set:

- Create/find customer and provision/lookup a dedicated funding account, if enabled.
- Initialize/verify a hosted checkout transaction, if used.
- List supported banks and resolve bank-account details.
- Create transfer recipients and initiate/query transfers.
- Verify transactions and fetch reconciliation records.
- Verify and normalize provider webhooks into Monicare domain events.

Keep API routes and ledger/domain services independent of Paystack-specific response payloads. Do not create a broad multi-provider framework unless the project has a concrete requirement for multiple live providers; the immediate need is to separate provider calls from ledger decisions.

### Phase 3: Funding and webhook migration

1. Provision Paystack funding destinations for existing users where supported; store them in provider-neutral columns.
2. Replace the Nomba webhook route with a separately configured Paystack endpoint. Validate signature against raw bytes, validate event type and amount/currency/reference, and persist the event before crediting.
3. Use an atomic idempotent database operation to insert the successful external payment and credit the user's wallet.
4. Run test-mode cases for success, duplicate event, invalid signature, unknown account, wrong amount/currency, delayed event, and database failure/retry.
5. Update the dashboard funding card to show only successfully provisioned account details or a functional checkout action.
6. Keep Nomba webhook processing read-only/limited to in-flight legacy items during the cutover; do not let both providers credit the same payment.

### Phase 4: Withdrawals and transfer reconciliation

1. Replace Nomba bank listing/lookup and transfer calls with Paystack operations.
2. Have the user confirm the resolved bank-account name before creating a transfer.
3. Reserve the wallet amount and create a pending withdrawal atomically before submitting a transfer.
4. Send the unique Monicare reference as the transfer reference/idempotency identifier supported by Paystack.
5. Treat network timeout or ambiguous response as `PENDING/UNKNOWN`, not as a reason to immediately refund or retry blindly.
6. Process verified transfer-success, transfer-failed, and reversal outcomes idempotently; release funds only after a definitive failure/reversal.
7. Add a reconciliation job for stuck pending transfers and compare Paystack transfer status with Monicare's ledger.

### Phase 5: Retire Nomba operations and migrate operations

1. Stop creating new Nomba accounts and new Nomba transfers only after Paystack production acceptance tests pass.
2. Notify users when their funding details change; existing Nomba virtual account numbers should not be represented as Paystack accounts or assumed to migrate.
3. Keep historical Nomba provider references for support and audit. Reconcile outstanding Nomba payments/withdrawals and settle or resolve them before disabling Nomba webhooks.
4. Remove or disable Nomba-only cron tasks and secrets after no live transaction depends on them.
5. Monitor wallet/transfer exceptions, unmatched events, pending age, provider balance, and ledger reconciliation daily during rollout.

## 12. Data model direction

The existing schema embeds provider names in fields such as `nomba_virtual_account`, `nomba_bank_name`, `nomba_account_ref`, `nomba_transaction_ref`, and `nomba_sub_account_id`. Replace active use with provider-neutral concepts, for example:

- Profile funding destination: provider, provider customer code, account number, bank code/name, account status, and external account reference.
- Payment transaction: Monicare reference, provider, provider reference, user, amount in minor units, currency, type, status, metadata, and timestamps.
- Withdrawal: user, verified recipient details or provider recipient code, requested amount, state, provider transfer code/reference, and state-transition timestamps.
- Webhook inbox: provider event ID/reference, event type, received time, signature-verification result, processing state, and payload storage subject to data minimization/retention policy.
- Ledger entries: immutable debit/credit postings linked to the payment/contribution/payout operation, with a database-enforced idempotency key.

The current `wallet_transactions` table may be evolved rather than replaced, but it must support a provider-neutral reference and reliable unique constraints. Existing Nomba records should remain queryable.

## 13. Acceptance criteria

### Product and ledger

- A member can register and see a real Paystack funding option when account capabilities are enabled; no placeholder funding instructions appear as usable.
- A successful top-up increases the correct member's balance once, even if the same webhook is delivered repeatedly.
- An unsuccessful, unsigned, mismatched, or unknown payment never credits a wallet.
- A scheduled contribution can be processed repeatedly by workers without duplicate debit or contribution records.
- A group payout is credited once and the cycle advances only after the payout operation has committed.

### Paystack operations

- Paystack bank lookup returns an account name that the member can confirm before a withdrawal begins.
- A transfer remains pending until its final provider status has been verified.
- A transfer failure or reversal releases the correct reserved amount once; a successful transfer does not restore it.
- Provider timeouts and duplicate webhooks do not cause duplicate transfers, duplicate refunds, or false success messages.
- Reconciliation identifies provider transactions/transfers absent from Monicare's ledger and ledger operations lacking provider confirmation.

### Migration

- Existing Nomba account details and transaction references remain available as historical data.
- New activity is attributed to Paystack and cannot be double-credited by legacy Nomba and new Paystack webhook paths.
- An operational runbook defines the cutover, rollback trigger, reconciliation procedure, and support response for pending transactions.

## 14. Risks and open decisions

1. **Paystack product eligibility:** Dedicated virtual accounts and Transfers may require account activation, additional onboarding, or market-specific configuration. Confirm before implementation assumptions become UX promises.
2. **Custody and product model:** Monicare's database has user wallet balances and group pools. A payment provider's collection account or merchant balance is not automatically a custodial sub-wallet per user or circle. Confirm the intended funds flow and applicable requirements.
3. **Payout destination:** Decide whether a circle payout remains an internal Monicare wallet credit or must transfer directly to a member's bank.
4. **Auto-debit definition:** Decide whether this means automatic use of an existing Monicare balance or a new provider-authorized card/bank charge. The current setting label and backend behavior differ.
5. **Existing Nomba funds:** Identify where existing balances are held and how user claims/withdrawals will be honored during and after cutover.
6. **Schema consistency:** Resolve existing database/model/query naming differences before writing migration SQL or relying on current group/payout flows.
7. **Provider failures and reconciliation:** Decide operational alerts, pending-timeout thresholds, manual review roles, and customer support escalation.

## 15. Paystack documentation to verify during implementation

Use the current official Paystack documentation for the products enabled on Monicare's merchant account, especially:

- [Dedicated NUBAN / virtual accounts](https://paystack.com/docs/payments/dedicated-nuban/)
- [Single transfers](https://paystack.com/docs/transfers/single-transfers/)
- [Paystack webhooks](https://paystack.com/docs/payments/webhooks/)
- [Paystack API reference](https://paystack.com/docs/api/)

Confirm current endpoint names, payloads, webhook event names, signature procedure, retry behavior, and product eligibility from the live official documentation before implementation. Provider details can change and are intentionally not treated as proven solely from the existing Nomba integration.
