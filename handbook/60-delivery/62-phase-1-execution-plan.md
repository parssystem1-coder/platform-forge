# ۶۲. پلن اجرایی فاز ۱

این فایل دقیقاً می‌گوید از کدام خط شروع کنی.

## ۶۲.۱ قدم‌ها

| قدم | خروجی | معیار اتمام |
|-----|--------|-------------|
| ۱ | مخزن و ابزار و CI و compose | `pnpm verify` سبز، compose بالا می‌آید |
| ۲ | مهاجرت ۰۰۰۱ و دو نقش DB و RLS | تست نشتی مستاجر سبز |
| ۳ | Kernel: context، config، errors، health، logging | لاگ ساختاریافته با correlationId |
| ۴ | ثبت‌نام و تأیید ایمیل | تست e2e کامل با Mailpit |
| ۵ | ورود و نشست و چرخش refresh | تست کشف مصرف مجدد |
| ۶ | Tenant و Membership و Context | تست دسترسی متقابل Tenant رد می‌شود |
| ۷ | `authorize()` و رجیستری Permission | تست ماتریس نقش کامل |
| ۸ | MFA و بازیابی رمز و لغو همه نشست‌ها | تست e2e هر سه مسیر |
| ۹ | Outbox و Audit و یک مصرف‌کننده | رخداد دقیقاً یک بار مصرف می‌شود |
| ۱۰ | OpenAPI و رانبوک | تست عدم انحراف OpenAPI سبز |

---

## ۶۲.۲ برش عمودی قدم ۴ تا ۶ (مهم‌ترین بخش)

```text
POST /api/v1/auth/register

در یک تراکنش:
  1. بررسی یکتایی ایمیل
  2. ساخت user با status = pending_verification
  3. ساخت credential با Argon2id
  4. ساخت tenant با slug یکتا
  5. ساخت membership با role = owner
  6. ساخت توکن تأیید (فقط hash ذخیره می‌شود)
  7. ثبت outbox: identity.user_registered و tenancy.tenant_created
  8. ثبت audit
COMMIT

سپس worker ایمیل را می‌فرستد.
```

### نکته پیاده‌سازی مهم

ساخت Tenant در همین تراکنش با RLS دردسر دارد، چون هنوز tenant وجود ندارد تا context بگیرد.
دو راه مجاز:

1. ساخت tenant با یک use case بوت‌استرپی که قبل از `SET LOCAL` اجرا می‌شود، سپس تنطیم context و ادامه
2. سیاست RLS جداگانه برای INSERT روی `tenants`

توصیه من: راه ۱. واضح‌تر است و سیاست RLS را پیچیده نمی‌کند.
این دقیقاً یکی از مواردی است که اگر از اول نگویی، ایجنت ۲ روز رویش گیر می‌کند.

---

## ۶۲.۳ اندپوینت‌های فاز ۱

```text
Public:
  POST /api/v1/auth/register
  POST /api/v1/auth/verify-email
  POST /api/v1/auth/resend-verification
  POST /api/v1/auth/login
  POST /api/v1/auth/refresh
  POST /api/v1/auth/request-password-reset
  POST /api/v1/auth/reset-password

Authenticated:
  POST   /api/v1/auth/logout
  POST   /api/v1/auth/logout-all
  GET    /api/v1/me
  GET    /api/v1/me/sessions
  DELETE /api/v1/me/sessions/:id
  POST   /api/v1/me/mfa/totp/setup
  POST   /api/v1/me/mfa/totp/verify
  POST   /api/v1/me/mfa/recovery-codes/regenerate
  GET    /api/v1/tenants
  POST   /api/v1/tenants/switch

Ops:
  GET /healthz
  GET /readyz
  GET /metrics
```

---

## ۶۲.۴ تصمیم‌های ریز که باید از اول قطعی باشند

| مورد | تصمیم |
|------|--------|
| عمر access token | ۱۵ دقیقه |
| عمر refresh token | ۳۰ روز |
| چرخش refresh | در هر فراخوانی |
| نام کوکی در پروداکشن | `__Host-refresh_token` |
| عمر توکن تأیید ایمیل | ۲۴ ساعت |
| عمر توکن بازیابی رمز | ۳۰ دقیقه |
| حداقل طول رمز | ۱۲ کاراکتر |
| قفل حساب | پس از ۵ خطا، با backoff توانی |
| تغییر رمز | لغو همه نشست‌های دیگر |
| منبع tenant فعال | هدر `X-Tenant-Id`، با اعتبارسنجی membership در هر درخواست |
| توکن tenant-agnostic است؟ | بله. توکن به Tenant گره نمی‌خورد |

---

## ۶۲.۵ ترتیب تست‌نویسی

اول این دو تست را بنویس، قبل از هر قابلیتی:

1. **تست نشتی مستاجر**: دو Tenant، دو کاربر، تلاش دسترسی متقابل
2. **تست اجبار مرز معماری**: اجرای dependency-cruiser در CI

اگر این دو را اول بنویسی، بقیه پروژه مجبور می‌شود درست بماند.
