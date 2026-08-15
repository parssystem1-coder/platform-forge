# نقشه کامل از درخواست تا دیتابیس و بازگشت پاسخ

## ۱. مسیر ورودی‌ها

```text
Browser User
  -> Next.js
  -> REST API
  -> API Gateway

Developer App
  -> API Key / OAuth
  -> REST API

AI Agent
  -> MCP
  -> MCP Adapter

Webhook Provider
  -> Webhook Receiver
  -> Idempotency Store

Internal Worker
  -> Application Service
```

همه مسیرها بعد از Interface به Application Service مشترک می‌رسند.

## ۲. مسیر استاندارد درخواست

```text
1. accept request
2. assign requestId
3. propagate correlationId
4. parse auth credentials
5. authenticate actor
6. resolve tenant context
7. validate membership or customer ownership
8. authorize action
9. validate feature
10. reserve quota if needed
11. execute use case
12. run domain invariants
13. persist aggregate
14. append audit record
15. append outbox event
16. commit transaction
17. publish asynchronously
18. map result to response
```

## ۳. مرز تراکنش

### داخل تراکنش

- داده اصلی
- تغییر وضعیت
- Ledger lines
- Quota reservation
- Audit مهم
- Outbox event

### خارج از تراکنش

- ارسال ایمیل
- تماس با Provider
- اجرای AI
- purge CDN
- اجرای Workflow

کارهای بیرونی فقط بعد از commit از طریق Outbox/Worker اجرا می‌شوند.

## ۴. جریان خطا

```text
Domain Error
 -> Application Error
 -> Problem Details Mapper
 -> RFC 9457 JSON
 -> Frontend Error Mapping
 -> Audit/Metric if security-sensitive
```

## ۵. جریان خواندن فروشگاه

```text
Host Header
 -> Domain Mapping Cache
 -> Tenant ID
 -> CDN
 -> ISR
 -> Storefront Read Model
 -> JSON/HTML response
```

هیچ صفحه عمومی فروشگاه برای کاتالوگ مستقیماً به جدول عملیاتی Order یا Product join سنگین نمی‌زند.

## ۶. جریان نوشتن فروشگاه

```text
Admin Command
 -> Product Aggregate
 -> Product table
 -> ProductUpdated Outbox
 -> Read Model Projector
 -> Cache Tag Invalidation
```

## ۷. شکست سرویس‌های جانبی

| سرویس خراب | رفتار صحیح |
|---|---|
| Email | داده اصلی commit می‌شود، Outbox retry می‌کند |
| Redis | مسیرهای حساس باید از Postgres ادامه دهند یا fail closed شوند |
| AI Provider | fallback یا release quota، بدون ثبت نتیجه جعلی |
| Payment Provider | Payment pending، reconciliation job |
| CDN | پاسخ از origin، نه تغییر داده |
| n8n | رخداد در صف داخلی می‌ماند، هسته متوقف نمی‌شود |
