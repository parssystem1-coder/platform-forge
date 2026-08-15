# کاتالوگ قابلیت و سقف مصرف

## کلیدهای Feature

```text
commerce.catalog
commerce.orders
commerce.inventory
commerce.customers
commerce.coupons
commerce.multi_currency
platform.api
platform.webhooks
platform.custom_domain
platform.white_label
ai.assistant
ai.seo_optimize
automation.workflows
crm.contacts
seo.audit
```

## کلیدهای Quota

| کلید | نوع | واحد |
|------|-----|------|
| `tenancy.members` | gauge | نفر |
| `commerce.products` | gauge | عدد |
| `commerce.orders_per_month` | counter | عدد |
| `storage.bytes` | gauge | بایت |
| `api.requests_per_month` | counter | درخواست |
| `ai.credits_per_month` | counter | کردیت |
| `email.sends_per_month` | counter | ایمیل |
| `automation.executions_per_month` | counter | اجرا |

## ماتریس پلن پیشنهادی

> این فقط نقطه شروع است. اعداد واقعی باید با مشتری واقعی تنطیم شوند.

| | Starter | Professional | Business | Enterprise |
|---|---|---|---|---|
| `commerce.catalog` | ✓ | ✓ | ✓ | ✓ |
| `commerce.orders` | ✓ | ✓ | ✓ | ✓ |
| `commerce.inventory` | – | ✓ | ✓ | ✓ |
| `commerce.coupons` | – | ✓ | ✓ | ✓ |
| `platform.api` | – | ✓ | ✓ | ✓ |
| `platform.custom_domain` | – | ✓ | ✓ | ✓ |
| `platform.white_label` | – | – | – | ✓ |
| `ai.assistant` | – | ✓ | ✓ | ✓ |
| `automation.workflows` | – | – | ✓ | ✓ |
| `tenancy.members` | 2 | 10 | 50 | توافقی |
| `commerce.products` | 500 | 5,000 | 50,000 | توافقی |
| `commerce.orders_per_month` | 200 | 5,000 | 50,000 | توافقی |
| `storage.bytes` | 10GB | 100GB | 500GB | توافقی |
| `ai.credits_per_month` | 0 | 10,000 | 50,000 | توافقی |

## قاعده مهم

این جدول در فاز ۱ تا ۳ یک فایل config است.
از فاز ۴ در دیتابیس می‌نشیند و Platform Admin ویرایشش می‌کند.
امضای تابع `isEnabled` در هر دو حالت یکسان است.
