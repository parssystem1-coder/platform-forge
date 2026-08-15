# Event Contract فاز ۷

```text
billing.subscription_created
billing.subscription_activated
billing.subscription_past_due
billing.subscription_paused
billing.subscription_canceled
billing.subscription_upgraded
billing.subscription_downgraded
billing.invoice_created
billing.invoice_finalized
billing.payment_created
billing.payment_succeeded
billing.payment_failed
billing.payment_refunded
billing.webhook_received
billing.reconciliation_mismatch
billing.ledger_entry_posted
```

## Event safety

- payment events idempotent
- ledger event source unique
- plan/feature cache invalidated only after subscription state commit
- every finance event has correlation id
