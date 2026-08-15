# تصمیم‌های لازم قبل از Production Billing

## محصول

- [ ] Trial چند روز است؟
- [ ] Trial کارت بانکی می‌خواهد؟
- [ ] آیا بعد از پایان Trial خودکار charge می‌شود؟
- [ ] grace period چند روز است؟
- [ ] cancellation فوری است یا پایان دوره؟
- [ ] downgrade فوری است یا پایان دوره؟
- [ ] refund policy چیست؟

## مالی

- [ ] ارز اولیه چیست؟
- [ ] واحد پول با integer minor unit چطور نگهداری می‌شود؟
- [ ] tax included یا excluded؟
- [ ] invoice numbering policy چیست؟
- [ ] credit note لازم است؟
- [ ] حساب‌های Ledger اصلی چه هستند؟

## Provider

- [ ] Payment Provider کدام است؟
- [ ] webhook signing چگونه validate می‌شود؟
- [ ] provider reference و idempotency چگونه map می‌شوند؟
- [ ] reconciliation API یا export دارد؟
- [ ] refund از API provider پشتیبانی می‌شود؟

## عملیاتی

- [ ] چه کسی payment incident را owner است؟
- [ ] سقف retry پرداخت چیست؟
- [ ] چه زمانی subscription suspend می‌شود؟
- [ ] چه داده‌ای باید برای compliance نگه داشته شود؟
