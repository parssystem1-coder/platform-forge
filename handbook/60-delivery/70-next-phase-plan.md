# بعد از فاز بستن بدهی چه می‌شود؟

## فاز بعدی رسمی: Commerce MVP Implementation

بعد از بسته شدن Phase 4، فاز بعدی دیگر سندنویسی نیست؛ **پیاده‌سازی واقعی Commerce MVP** است.

## شرط شروع

این موارد باید سبز باشند:

- API و Worker واقعی بالا می‌آیند
- migration و roleها واقعی‌اند
- RLS و Tenant Leak Suite سبز است
- outbox crash/retry test سبز است
- OpenAPI drift check فعال است
- Agent Phase Plan و Architecture Status تحویل داده است

## خروجی فاز بعد

```text
Product
 -> Variant
 -> Storefront Read Model
 -> Customer/Guest
 -> Cart
 -> Inventory Reservation
 -> Checkout
 -> Order
 -> Fake/Manual Payment Port
 -> Notification
```

## ترتیب پیاده‌سازی فاز بعد

1. Catalog operational tables و repository
2. Product Use Cases و permissionها
3. Product events و Read Model projector
4. Storefront slug read path
5. Customer و Guest checkout
6. Cart
7. Inventory atomic reservation
8. Order و snapshot قیمت
9. Checkout idempotency
10. Fake payment adapter
11. notification order confirmation
12. concurrency، tenant leak و performance tests

## چیزی که هنوز بعد از آن باقی می‌ماند

فاز بعد از Commerce MVP: **Production Reliability و سپس Feature/Plan**. Billing واقعی را قبل از داشتن جریان Commerce قابل‌فروش شروع نمی‌کنیم.
