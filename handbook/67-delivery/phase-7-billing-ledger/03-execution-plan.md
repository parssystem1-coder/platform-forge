# برنامه اجرای فاز ۷

## Workstream A: Subscription

- [ ] subscription migration
- [ ] lifecycle state machine
- [ ] plan assignment history
- [ ] trial creation
- [ ] pause/cancel/resume
- [ ] grace period job

## Workstream B: Invoice

- [ ] invoice tables
- [ ] immutable line snapshots
- [ ] numbering service
- [ ] invoice status
- [ ] credit note contract
- [ ] invoice API

## Workstream C: Provider Boundary

- [ ] PaymentProvider port
- [ ] fake provider tests
- [ ] provider adapter contract
- [ ] webhook raw event storage
- [ ] signature validation
- [ ] idempotency handling

## Workstream D: Ledger

- [ ] chart of accounts
- [ ] ledger entry service
- [ ] balanced-entry database validation
- [ ] payment posting
- [ ] refund posting
- [ ] deferred revenue posting
- [ ] immutable audit

## Workstream E: Upgrade/Downgrade

- [ ] proration calculator
- [ ] immediate upgrade
- [ ] end-of-period downgrade
- [ ] data-preservation tests
- [ ] feature cache invalidation
- [ ] plan history

## Workstream F: Reconciliation

- [ ] provider status fetch port
- [ ] unmatched payment report
- [ ] missing webhook recovery
- [ ] duplicate webhook handling
- [ ] daily reconciliation job
- [ ] finance alert

## Workstream G: Gate

- [ ] full subscription lifecycle test
- [ ] ledger balance property test
- [ ] webhook replay test
- [ ] reconciliation test
- [ ] upgrade/downgrade e2e
- [ ] incident runbook
