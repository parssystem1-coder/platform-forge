# نقشه قابلیت‌های پلتفرم

## نقشه لایه‌ای

| لایه | قابلیت‌ها | وضعیت |
|---|---|---|
| تجربه عمومی | سایت معرفی، قیمت‌گذاری، ثبت‌نام، دامنه فروشگاه | فاز ۰ تا ۷ |
| هویت | User، Login، MFA، Session، Password Reset | فاز ۱ |
| کسب‌وکار | Tenant، Membership، Invitation، Role | فاز ۱ |
| Commerce | Product، Category، Inventory، Cart، Order، Customer | فاز ۲ |
| رشد مشتری | Notification، Analytics پایه، Coupon، Shipping | فاز ۳ |
| درآمد پلتفرم | Plan، PlanVersion، Subscription، Invoice، Payment | فاز ۴ تا ۵ |
| کنترل مصرف | Feature، Quota، Usage، Add-on | فاز ۴ تا ۶ |
| اتصال | API Keys، OAuth، Webhooks | فاز ۷ |
| هوش مصنوعی | AI Gateway، Model Router، Credits، RAG | فاز ۸ |
| اتوماسیون | Workflow داخلی، Queue، Automation Gateway | فاز ۹ |
| Agent | MCP Tool Registry، Tool Execution، Audit | فاز ۱۰ |
| توسعه‌پذیری | Plugin SDK، Manifest، Compatibility | فاز ۱۱ |
| اکوسیستم | Marketplace، Revenue Share | فاز ۱۲ |
| سازمانی | White Label، Dedicated Infra، SSO | فاز ۱۳ |

## ماتریس وابستگی

| قابلیت | وابسته به | خروجی برای |
|---|---|---|
| Commerce | Identity، Tenancy، AuthZ، Outbox | Storefront، Billing، Analytics |
| Billing | Tenancy، Ledger، Payment Provider | Feature، Quota، Subscription |
| AI | AuthZ، Feature، Quota، Usage | SEO، CRM، Support |
| MCP | API Contract، AuthZ، Audit | AI Agents، Automation |
| Plugin | Public API، Permissions، Events | Marketplace |

## قابلیت‌هایی که از روز اول باید Contract داشته باشند

حتی اگر پیاده‌سازی‌شان دیرتر است، این قراردادها از ابتدا مشخص‌اند:

- Actor Context
- Tenant Context
- Authorization Decision
- Feature Resolver
- Quota Reservation
- Application Service
- Domain Event Envelope
- Outbox Event
- Audit Record
- Public API Versioning
- Plugin Manifest
- AI Gateway Request
