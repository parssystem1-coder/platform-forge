# اسکریپت دمو فاز ۱

## پیش‌نیاز

```bash
pnpm install
pnpm infra:up
pnpm db:migrate
pnpm dev
```

## اجرا

1. `POST /auth/register` با email و tenant اول
2. باز کردن Mailpit در `localhost:8025`
3. کلیک روی verification link
4. `POST /auth/login`
5. ذخیره access token در client
6. `GET /me`
7. `GET /tenants`
8. ساخت Tenant دوم از مسیر test/admin یا fixture
9. `POST /tenants/switch` با Tenant دوم
10. اجرای `GET` روی endpoint tenant-bound
11. ارسال `X-Tenant-Id` Tenant اول بدون membership context معتبر و مشاهده denial
12. `POST /auth/logout-all`
13. اجرای refresh و مشاهده `401`
14. اجرای `pnpm test:tenant-leak`

## نتیجه‌ای که باید نشان داده شود

```text
User واحد
 -> دو Tenant
 -> دو Membership
 -> context قابل تغییر
 -> داده‌ها جدا
 -> session قابل revoke
 -> audit و outbox قابل مشاهده
```
