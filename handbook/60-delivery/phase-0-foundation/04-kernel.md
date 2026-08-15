# ۰.۴ Platform Kernel

## اجزا

### Config

Schema-validated، typed و بدون خواندن مستقیم env در domain.

### Request Context

```text
requestId
correlationId
userId
sessionId
tenantId
actorKind
```

با AsyncLocalStorage در طول request قابل دسترسی است.

### Unit of Work

تنها مسیر مجاز برای transaction و `withTenant`.

### Error Layer

تمام خطاها به RFC 9457 Problem Details تبدیل می‌شوند.

### Observability

Pino structured logs، OpenTelemetry hooks، metrics، health و readiness.

### Idempotency

برای register، refresh، payment، webhook و order در contract آماده است.

## Definition of Done

- [ ] domain به framework دسترسی ندارد
- [ ] request و correlation id در همه logهای request هستند
- [ ] `/healthz` فقط زنده بودن process را چک می‌کند
- [ ] `/readyz` DB و Redis و migration را چک می‌کند
- [ ] خطای داخلی secret یا token لو نمی‌دهد
