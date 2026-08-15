# ۰.۲ زیرساخت محلی

## سرویس‌ها

| سرویس | کاربرد |
|---|---|
| PostgreSQL 16 | منبع حقیقت داده، تراکنش، RLS |
| Redis 7 | rate limit، lock، idempotency، cache کوتاه‌عمر |
| Mailpit | دریافت ایمیل در local |
| S3-compatible storage | در فاز بعد برای فایل؛ در local می‌تواند MinIO باشد |

## قانون

Redis منبع حقیقت نیست. حذف Redis نباید داده دائمی را حذف کند.

## Definition of Done

- [ ] Compose با یک دستور بالا می‌آید
- [ ] healthcheck همه سرویس‌ها فعال است
- [ ] پورت‌ها و credentialها از env می‌آیند
- [ ] داده‌های local volume دارند
- [ ] reset محیط مستند شده است
