# معیار پذیرش فاز ۳

## Worker

- [ ] با shutdown سیگنال، job در حال اجرا را تا timeout مدیریت می‌کند
- [ ] jobهای جدید بعد از shutdown claim نمی‌شوند
- [ ] دو worker یک event را هم‌زمان دوباره اجرا نمی‌کنند
- [ ] job timeout و heartbeat دارد
- [ ] worker بدون API process قابل اجراست

## Outbox

- [ ] خطای transient با backoff retry می‌شود
- [ ] خطای permanent بی‌نهایت retry نمی‌شود
- [ ] پس از سقف تلاش به dead-letter می‌رود
- [ ] replay dead-letter فقط با audit انجام می‌شود
- [ ] event منتشرشده retention می‌شود، حذف کورکورانه ندارد

## Notification

- [ ] ارسال ایمیل از request اصلی جداست
- [ ] ترجیح کاربر رعایت می‌شود
- [ ] زبان و timezone درست resolve می‌شود
- [ ] خطای provider باعث rollback سفارش نمی‌شود
- [ ] retry ارسال idempotent است
- [ ] داده حساس در template log نمی‌شود

## Read Model

- [ ] event تکراری projection را دوباره خراب نمی‌کند
- [ ] event قدیمی‌تر از version فعلی اعمال نمی‌شود
- [ ] projection قابل rebuild از source events است
- [ ] lag بیشتر از ۳۰ ثانیه alert می‌دهد

## Recovery

- [ ] reservation منقضی آزاد می‌شود
- [ ] session منقضی cleanup می‌شود
- [ ] Redis failure مسیر data loss ایجاد نمی‌کند
- [ ] backup restore runbook اجراپذیر است
