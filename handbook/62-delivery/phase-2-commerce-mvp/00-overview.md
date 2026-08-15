# فاز ۲: Commerce MVP

## هدف

ساخت اولین قابلیت پول‌ساز پلتفرم: یک Tenant بتواند محصول ایجاد کند، storefront عمومی داشته باشد و سفارش واقعی دریافت کند.

## خروجی فاز

```text
Tenant User
 -> Product + Variant
 -> Storefront Read Model
 -> Public Product Page
 -> Shopper / Guest Customer
 -> Cart
 -> Checkout
 -> Atomic Inventory Reservation
 -> Order
 -> Payment Adapter
 -> Paid Order
 -> Notification + Audit + Outbox
```

## خارج از دامنه

Subscription، Plan، Billing پلتفرم، CRM، SEO، AI، MCP، Plugin، Marketplace، Shipping پیچیده، Multi-currency پیچیده، Search اختصاصی.

Payment در این فاز فقط به‌صورت Port و یک Fake/Manual adapter برای تست ساخته می‌شود؛ Payment واقعی در فاز ۵ می‌آید.
