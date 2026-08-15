# فاز ۵: Commerce MVP Implementation

## هدف

این فاز اولین قابلیت واقعی و قابل‌فروش پلتفرم را پیاده‌سازی می‌کند. خروجی دیگر صرفاً قرارداد یا skeleton نیست؛ باید یک Tenant بتواند کاتالوگ بسازد و یک Shopper بتواند سفارش آزمایشی ثبت کند.

## پیش‌شرط اجباری

این فاز فقط بعد از PASS شدن فاز Architecture Debt Closure شروع می‌شود:

- API/Worker واقعی
- workspace و lockfile واقعی
- DB roles و RLS واقعی
- Tenant Leak Suite واقعی
- Outbox مقاوم
- OpenAPI drift check

اگر این‌ها هنوز فقط `SPEC` یا `SKELETON` هستند، Agent باید ابتدا فاز ۴ را کامل کند.

## مسیر نهایی فاز

```text
Tenant User
 -> Create Product
 -> Create Variant
 -> Set Inventory
 -> Product Event
 -> Storefront Read Model
 -> Public Product Page
 -> Guest/Customer Cart
 -> Checkout
 -> Atomic Inventory Reservation
 -> Pending Order
 -> Fake/Manual Payment Adapter
 -> Paid Order
 -> Audit + Outbox + Notification
```

## خارج از دامنه

پرداخت واقعی، Subscription، Plan، Billing پلتفرم، Coupon پیچیده، Shipping، Multi-currency پیشرفته، CRM، SEO، AI، MCP، Plugin و Marketplace.
