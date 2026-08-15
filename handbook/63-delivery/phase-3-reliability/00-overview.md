# فاز ۳: Workers + Notifications + Reliability

## هدف

Commerce MVP بدون Worker و Notification فقط روی لپ‌تاپ کار می‌کند. این فاز سیستم را از یک demo به یک سرویس قابل‌اتکا تبدیل می‌کند:

```text
Domain Write
 -> Transactional Outbox
 -> Worker Claim
 -> Idempotent Handler
 -> Email / Read Model / Retry / Metrics
```

## خروجی نهایی

- Worker مستقل و قابل scale
- Queue و retry استاندارد
- Notification Platform حداقلی
- Email templates و preferences
- Read Model projector قابل replay
- Outbox retention و dead-letter
- Jobهای cleanup و reconciliation پایه
- Dashboard و alertهای عملیاتی
- تست failure و recovery

## خارج از دامنه

SMS، Push، Webhook عمومی، Kafka، Kubernetes، Multi-region، OpenSearch و Notificationهای پیچیده چندکاناله.
