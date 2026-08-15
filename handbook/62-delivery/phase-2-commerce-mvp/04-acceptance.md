# معیار پذیرش Commerce MVP

- [ ] Tenant User با permission درست محصول می‌سازد.
- [ ] Tenant User بدون permission نمی‌تواند محصول بسازد.
- [ ] Product در storefront طی حداکثر ۳۰ ثانیه دیده می‌شود.
- [ ] هدر tenant جعلی روی storefront اثر ندارد.
- [ ] یک email می‌تواند در دو Tenant customer مستقل باشد.
- [ ] Guest checkout کار می‌کند.
- [ ] قیمت سفارش از منبع حقیقت خوانده می‌شود.
- [ ] Order line قیمت و title زمان خرید را حفظ می‌کند.
- [ ] ۵۰ checkout هم‌زمان روی موجودی ۱۰ تایی حداکثر ۱۰ موفقیت دارد.
- [ ] پرداخت ناموفق reservation را آزاد می‌کند.
- [ ] retry با idempotency key سفارش تکراری نمی‌سازد.
- [ ] Order event و Audit ثبت می‌شوند.
- [ ] Read Model مرجع حقیقت نیست و مستقیم در checkout استفاده نمی‌شود.
- [ ] p95 صفحه محصول cache hit زیر ۱۰۰ms است.
- [ ] p95 create order در محیط test زیر ۸۰۰ms است.
