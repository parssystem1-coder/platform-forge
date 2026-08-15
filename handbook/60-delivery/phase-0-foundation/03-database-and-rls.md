# ۰.۳ دیتابیس و RLS

## نقش‌ها

```text
platform_owner  -> اجرای migration، مالک schema
platform_app    -> اجرای API، بدون مالکیت جدول، بدون BYPASSRLS
```

## ترتیب

1. ساخت roleها
2. اجرای migration core
3. فعال کردن RLS
4. فعال کردن FORCE RLS
5. ثبت policy برای هر جدول tenant-bound
6. تست با role واقعی اپلیکیشن

## الگوی اجباری

```sql
select set_config('app.tenant_id', $1, true);
```

`true` یعنی تنظیم فقط تا پایان transaction معتبر است؛ این جلوی نشت context روی connection pool را می‌گیرد.

## جدول‌های platform-wide

`users`, `sessions`, `credentials` tenant-bound نیستند.

## جدول‌های tenant-bound

`tenants`, `memberships`, `customers`, `products`, `orders`, `inventory`, `audit tenant rows`, `quota` و هر جدول دامنه‌ای آینده.

## Definition of Done

- [ ] نقش اپلیکیشن owner جدول‌ها نیست
- [ ] `rolbypassrls = false`
- [ ] `FORCE ROW LEVEL SECURITY` فعال است
- [ ] query بدون tenant context داده tenant-bound نمی‌دهد
- [ ] query با tenant A داده tenant B نمی‌دهد
