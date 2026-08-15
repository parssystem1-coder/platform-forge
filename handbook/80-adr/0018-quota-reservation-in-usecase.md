# ADR-0018: رزرو سهمیه در Use Case انجام می‌شود، نه در authorize

## وضعیت

pending review — برخاسته از F-022

## زمینه

`AuthorizationService` یک `QuotaChecker.assertAvailable()` داشت. این دقیقاً الگوی read-then-write است که خود همین بسته در قانون طلایی ۷ و ADR-0006 ممنوع کرده.

مسئله عمیق‌تر: `authorize` قبل از تراکنش صدا زده می‌شود، ولی رزرو باید درون همان تراکنشی باشد که نوشتن را انجام می‌دهد. پس این دو ذاتاً در یک جا جمع نمی‌شوند.

## تصمیم

`authorize()` دیگر سهمیه را نمی‌سنجد. خروجیش `AuthorizationResult` است که می‌گوید این عملیات کدام `quotaKey` را می‌خواهد. Use Case موظف است:

```text
authorize() -> quotaKey
  BEGIN
    quota.reserve(tx, ...)
    domain write
    audit + outbox
    quota.commit(tx, reservation, actual)
  COMMIT
```

یک تست معماری تضمین می‌کند هر Use Caseی که `quotaKey` می‌گیرد، `reserve` را هم صدا زده باشد.

## پیامد منفی

- مسئولیت از kernel به Use Case منتقل می‌شود، پس فراموش کردنش ممکن است. جواب: تست معماری، نه دقت انسانی.
- خروجی `authorize` از `void` به یک object تغییر کرد، یعنی تمام call siteها باید به‌روز شوند. الان که تعدادشان صفر است، بهترین زمان این تغییر است.

## شرط بازبینی

اگر جایی لازم شد قبل از شروع کار فقط به کاربر «سقفت پر است» نشان داده شود (مانند غیرفعال کردن دکمه)، یک تابع جداگانه read-only فقط برای UI اضافه شود، نه در مسیر تصمیم.
