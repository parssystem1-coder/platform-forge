# ARCHITECTURE_STATUS

## Status vocabulary

```text
SPEC                 فقط سند
SKELETON             نمونه یا bootstrap ناقص
IMPLEMENTED          کد واقعی با تست مربوطه
INTEGRATION-READY    قابل اتصال، با hardening باقی‌مانده
PRODUCTION-READY     Gate عملیاتی و امنیتی سبز
```

## Required table

| Component | Status | Evidence | Missing | Owner | Review date |
|---|---|---|---|---|---|
| API bootstrap |  |  |  |  |  |
| Worker bootstrap |  |  |  |  |  |
| Database roles |  |  |  |  |  |
| RLS |  |  |  |  |  |
| Tenant leak suite |  |  |  |  |  |
| Outbox |  |  |  |  |  |
| OpenAPI enforcement |  |  |  |  |  |
| Error catalog enforcement |  |  |  |  |  |
| Identity |  |  |  |  |  |
| Commerce |  |  |  |  |  |
| Notifications |  |  |  |  |  |

## Evidence rules

هر status باید به یکی از این‌ها لینک شود:

- test path
- migration path
- CI job
- running endpoint
- demo script
- production dashboard

ادعای «ساخته شد» بدون evidence پذیرفته نیست.
