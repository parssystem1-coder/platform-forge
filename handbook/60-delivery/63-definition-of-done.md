# 14. Definition of Done

گام اول فقط وقتی done است که **همه**‌ی موارد زیر برقرار باشند.

## 14.1 Functional

- کاربر می‌تواند ثبت‌نام کند
- ایمیل verification واقعی تولید و مصرف می‌شود
- user, tenant, owner membership در یک تراکنش ساخته می‌شوند
- user تأییدنشده login نمی‌کند
- user می‌تواند login کند و access/refresh بگیرد
- refresh rotation کار می‌کند
- refresh reuse detection session family را revoke می‌کند
- password reset کامل کار می‌کند
- MFA setup/verify/login کار می‌کند
- user می‌تواند sessionهایش را ببیند و revoke کند
- logout current و logout all کار می‌کند
- tenant list و tenant switch کار می‌کند

## 14.2 Security

- passwordها Argon2id هستند
- token plaintext در DB ذخیره نمی‌شود
- cookieها secure policy درست دارند
- rate limiting روی endpointهای عمومی فعال است
- RLS روی همه‌ی جداول tenant-bound فعال و tested است
- app DB role مالک جدول‌ها نیست و BYPASSRLS ندارد

## 14.3 Architecture

- dependency rule در CI enforce می‌شود
- domain مستقل از framework است
- controller business logic ندارد
- repositoryها tenant-aware path را bypass نمی‌کنند
- outbox برای writeهای اصلی ثبت می‌شود

## 14.4 Observability

- requestId و correlationId در همه‌ی logها هستند
- healthz و readyz درست کار می‌کنند
- metrics endpoint فعال است
- audit برای عملیات حساس ثبت می‌شود

## 14.5 Documentation

- OpenAPI به‌روز است
- runbook local setup معتبر است
- ADRها ثبت شده‌اند
- خطاهای problem+json کاتالوگ دارند

## 14.6 Tests

- unit سبز
- integration سبز
- e2e سبز
- tenant leak suite سبز
- architecture tests سبز

اگر یکی از این‌ها نیست، done نیست. خیلی ساده.
