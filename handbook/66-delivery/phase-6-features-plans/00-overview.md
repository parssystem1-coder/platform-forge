# فاز ۶: Features + Plans

## هدف

تبدیل Feature و Plan از config و قرارداد مفهومی به یک سیستم واقعی و نسخه‌دار که بتواند قابلیت‌های Tenant را فعال یا محدود کند، بدون حذف داده در Downgrade.

## خروجی

```text
Platform Admin
 -> Create Plan
 -> Publish PlanVersion
 -> Set Features + Quotas + Prices
Tenant
 -> Subscribe/assign PlanVersion
 -> Effective Feature Calculation
 -> authorize()
 -> 402/429 when unavailable
```

## خارج از دامنه

Payment واقعی، Invoice نهایی، Proration کامل، Tax engine، Marketplace، Enterprise dedicated infrastructure و Usage billing کامل. این‌ها در فاز Billing می‌آیند.
