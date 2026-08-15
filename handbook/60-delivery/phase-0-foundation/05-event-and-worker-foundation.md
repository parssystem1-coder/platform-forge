# ۰.۵ Outbox و Worker Foundation

## هدف

حتی قبل از Commerce، سیستم باید بلد باشد تغییر مهم را پایدار ثبت و بعداً منتشر کند.

## جریان

```text
Application transaction
  ├── domain data
  ├── audit record
  └── outbox event
          ↓ commit
Worker
  ├── claim with SKIP LOCKED
  ├── publish
  ├── retry with backoff
  └── dead letter after max attempts
```

## Definition of Done

- [ ] rollback باعث وجود event نمی‌شود
- [ ] دو worker یک event را هم‌زمان claim نمی‌کنند
- [ ] consumer idempotent است
- [ ] dead-letter مسیر مشخص دارد
- [ ] طول صف و قدیمی‌ترین event metric دارد
