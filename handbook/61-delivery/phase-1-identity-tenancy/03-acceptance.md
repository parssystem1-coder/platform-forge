# Acceptance Criteria فاز ۱

## Registration

- [ ] ایمیل تکراری بدون افشای اطلاعات حساس رد می‌شود
- [ ] slug تکراری با خطای قابل فهم رد می‌شود
- [ ] password plaintext هیچ‌جا ذخیره یا log نمی‌شود
- [ ] User، Tenant و Owner Membership در یک تراکنش ساخته می‌شوند
- [ ] token تأیید فقط به‌صورت hash ذخیره می‌شود
- [ ] token منقضی یا مصرف‌شده دوباره قابل استفاده نیست

## Authentication

- [ ] User تأییدنشده نمی‌تواند session کامل بگیرد
- [ ] access token عمر کوتاه دارد
- [ ] refresh token در cookie HttpOnly است
- [ ] refresh rotation اجباری است
- [ ] reuse یک token، کل family را compromised می‌کند
- [ ] logout current و logout all کار می‌کنند

## Tenancy

- [ ] User می‌تواند چند Membership داشته باشد
- [ ] membership غیرفعال درخواست را رد می‌کند
- [ ] Tenant suspended درخواست tenant-bound را رد می‌کند
- [ ] Header جعلی بدون membership پذیرفته نمی‌شود
- [ ] query بدون tenant context داده tenant-bound برنمی‌گرداند
- [ ] RLS جلوی query اشتباه را می‌گیرد

## Authorization

- [ ] هیچ controller مستقیماً role را مقایسه نمی‌کند
- [ ] همه permission checkها از authorize عبور می‌کنند
- [ ] Viewer عملیات write ندارد
- [ ] آخرین Owner حذف یا تنزل داده نمی‌شود
- [ ] خطاها Problem Details با code ثابت هستند

## Security

- [ ] rate limit روی login، register، reset و refresh فعال است
- [ ] secret و token در log نیست
- [ ] Audit برای login، logout، reset، MFA و tenant switch ثبت می‌شود
- [ ] تست dependency boundary سبز است
