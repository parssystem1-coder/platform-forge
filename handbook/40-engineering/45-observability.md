# 10. Observability

## 10.1 هدف

اگر production خراب شد باید ظرف چند دقیقه بفهمیم:

- چه requestی خراب شد
- برای کدام user/tenant
- در کدام use case
- با چه correlation id
- در کدام dependency

اگر این را نداریم، observability نداریم.

---

## 10.2 Request context

برای هر request:

- `requestId`
- `correlationId`
- `userId` (if authenticated)
- `sessionId` (if authenticated)
- `tenantId` (if resolved)

این context در AsyncLocalStorage نگه داشته می‌شود و در log/traces تزریق می‌شود.

---

## 10.3 Logging

### Format

JSON logs only.

### Minimum fields

- timestamp
- level
- service
- env
- event
- message
- requestId
- correlationId
- userId
- tenantId
- error.code
- error.stack (non-prod full, prod controlled)

### Example

```json
{
  "level": "info",
  "event": "auth.login.succeeded",
  "requestId": "...",
  "correlationId": "...",
  "userId": "...",
  "sessionId": "..."
}
```

---

## 10.4 Metrics

حداقل metricها:

- http request count
- request duration histogram
- login success/failure count
- refresh success/reuse-detected count
- active session count
- outbox pending count
- outbox publish latency
- db query latency
- rate-limit reject count

---

## 10.5 Tracing

Spanهای اصلی:

- http request
- db transaction
- email send
- redis operation
- outbox publish loop

Trace باید بتواند register flow را از request تا DB و outbox نشان دهد.

---

## 10.6 Health endpoints

### `/healthz`

فقط نشان می‌دهد پروسه بالا است.

### `/readyz`

نشان می‌دهد سرویس آماده‌ی سرو کردن است:

- DB reachable
- Redis reachable (اگر hard dependency)
- migration level acceptable

اگر migration لازم ولی اجرا نشده باشد، readiness باید fail شود.

---

## 10.7 Error tracking

در staging/prod همه‌ی خطاهای uncaught و problem details 5xx باید به error tracker بروند.
PII scrub اجباری است.

---

## 10.8 Audit vs logs

- **Logs** برای عملیات فنی و عیب‌یابی
- **Audit** برای trail قابل اتکا و business/security events

Audit جای log را نمی‌گیرد. log هم جای audit را نمی‌گیرد.
