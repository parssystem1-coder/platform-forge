# API Contract فاز ۷

## Tenant Billing

```text
GET  /api/v1/billing/subscription
POST /api/v1/billing/subscription/upgrade
POST /api/v1/billing/subscription/downgrade
POST /api/v1/billing/subscription/cancel
POST /api/v1/billing/subscription/resume
GET  /api/v1/billing/invoices
GET  /api/v1/billing/invoices/:id
POST /api/v1/billing/invoices/:id/pay
POST /api/v1/billing/payments/:id/refund
```

## Provider Webhook

```text
POST /webhooks/payments/:provider
```

Rules:
- raw body لازم است
- signature verify قبل از process
- provider event id unique است
- پاسخ سریع پس از enqueue

## Platform Finance

```text
GET /platform/v1/reconciliation/runs
POST /platform/v1/reconciliation/run
GET /platform/v1/ledger/entries
```
