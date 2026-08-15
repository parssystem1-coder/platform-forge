# ۱۳. کاتالوگ ماژول‌ها

هر ماژول یک مالک مشخص، قرارداد مشخص و فاز مشخص دارد.

## ۱۳.۱ Platform Core

### `platform-kernel` (فاز ۱)
مالک زیرساخت افقی. هیچ منطق کسب‌وکاری ندارد.

- Config با اعتبارسنجی schema
- Request Context (AsyncLocalStorage)
- Unit of Work و `withTenant`
- لایه خطا و نگاشت problem+json
- Logging و Tracing و Metrics
- Health و Readiness
- Idempotency store
- Rate limiter

### `identity` (فاز ۱)
- User، Credential
- Email verification، Password reset
- Session، Refresh rotation، Reuse detection
- MFA (TOTP و Recovery codes)

**قرارداد عمومی:** `RegisterUser`, `AuthenticateUser`, `RotateSession`, `RevokeSession`, `GetUserView`

### `tenancy` (فاز ۱)
- Tenant، Membership، Invitation
- Tenant context resolution، Tenant switching
- Tenant lifecycle (active و suspended و archived)

**قرارداد عمومی:** `CreateTenant`, `InviteMember`, `AcceptInvitation`, `ResolveTenantContext`, `AssertMembership`

### `access-control` (فاز ۱)
- Permission registry
- Role به Permission
- Feature resolver (فاز ۱: config، فاز ۴: دیتابیس)
- Quota service (فاز ۲ به بعد)
- تابع واحد `authorize()`

### `billing` (فاز ۵)
- Plan، PlanVersion، Add-on
- Subscription lifecycle
- Invoice، Payment، Refund، Credit، Tax، Proration
- Ledger دوطرفه
- Payment provider port و webhook و reconciliation

### `metering` (فاز ۶)
- Usage event ingestion
- تجمیع دوره‌ای
- اتصال به Quota

### `notifications` (فاز ۳)
- Template، Preference، Localization
- کانال: Email، بعداً SMS و In-App و Webhook

### `audit` (فاز ۱)
- رکورد append-only
- جستجوی محدود برای پنل

### `outbox` (فاز ۱)
- جدول رخداد
- Publisher با backoff
- مصرف‌کننده درون‌پروسه‌ای

### `domains` (فاز ۷)
- Subdomain mapping
- Custom domain، تأیید DNS، مدیریت SSL

---

## ۱۳.۲ Domain Modules

### `commerce` (فاز ۲)
زیردامنه‌ها در یک ماژول، با مرز داخلی روشن:

| زیردامنه | فاز |
|----------|------|
| Catalog (Product, Variant, Category, Media) | ۲ |
| Customer (Shopper identity, Address) | ۲ |
| Cart و Checkout | ۲ |
| Order و Fulfillment | ۲ |
| Inventory (رزرو اتمیک) | ۲ |
| Payment (پرداخت خریدار) | ۲ |
| Shipping و Coupon و Report | ۳ |

### دامنه‌های بعدی
`crm` (فاز ۱۰+) · `seo` (فاز ۱۰+) · `accounting` (فاز ۱۱+) · `support` · `analytics`

هر کدام با همان الگو: domain و application و REST و events و permissions و features.

---

## ۱۳.۳ Extension Layer

| ماژول | فاز | شرط ورود |
|-------|------|-----------|
| `public-api` (API key، scope، نسخه) | ۷ | اولین مشتری که یکپارچگی می‌خواهد |
| `webhooks` (تحویل به بیرون) | ۷ | همراه public-api |
| `automation` (Gateway داخلی) | ۹ | دو سناریوی واقعی تکرارشونده |
| `ai-gateway` | ۸ | یک جریان AI واقعی با تقاضا |
| `mcp` | ۱۰ | پایداری API و دسترسی |
| `plugins` | ۱۲ | ۳ افزونه شخص ثالث واقعی |
| `marketplace` | ۱۳ | ۵ افزونه و مدل درآمد |

---

## ۱۳.۴ قالب افزودن یک ماژول جدید

هر ماژول جدید باید این هشت مورد را تحویل دهد. کمتر از این، ماژول ناقص است:

1. موجودیت‌ها و قوانین دامنه
2. Use Case ها با ورودی و خروجی صریح
3. مهاجرت دیتابیس همراه با سیاست RLS
4. رجیستری Permission
5. کلیدهای Feature و Quota (اگر قابلیت فروشی است)
6. کاتالوگ رخداد
7. اندپوینت REST و به‌روزرسانی OpenAPI
8. تست: unit و integration و e2e و tenant-leak

**این همان چیزی است که قابلیت توسعه را واقعی می‌کند**، نه وجود پوشه‌های خالی به نام crm و seo.
