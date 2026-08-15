# ۱۸. سهمیه و اندازه‌گیری مصرف

## ۱۸.۱ چرا این بخش سخت است

در نسخه اولیه، Quota یک خط بود. واقعیت این است:

```text
الگوی غلط و خطرناک:
  used = SELECT count(*) ...
  if (used < limit) { create(); }
```

دو درخواست هم‌زمان با `used = limit - 1` هر دو رد می‌شوند یا هر دو قبول می‌شوند.
روی AI Credit این دقیقاً معنی‌اش فروختن چیزی است که وجود ندارد.

> این باگ در تست تک‌کاربره هرگز دیده نمی‌شود. در پروداکشن قطعاً دیده می‌شود.

---

## ۱۸.۲ دو نوع سهمیه

| نوع | معنا | مثال | الگو |
|-----|-------|------|------|
| **سقف موجودی** (gauge) | در لحظه چقدر داری | تعداد محصول، تعداد کاربر، حجم استوریج | شمارش در تراکنش |
| **مصرف دوره‌ای** (counter) | در این دوره چقدر مصرف کردی | AI credit، API call، ایمیل، پیامک | رزرو اتمیک |

این دو را قاطی نکن. منطقشان متفاوت است.

---

## ۱۸.۳ الگوی رزرو اتمیک

```text
reserve  -> کم کردن اتمیک و ثبت رزرو با وضعیت pending
commit   -> قطعی کردن مصرف
release  -> بازگرداندن در صورت شکست
```

### مدل داده

```text
quota_counters
  tenant_id, quota_key, period_start, period_end
  limit_value bigint
  used_value  bigint
  reserved_value bigint
  PRIMARY KEY (tenant_id, quota_key, period_start)

quota_reservations
  id, tenant_id, quota_key, quantity
  status: pending | committed | released
  idempotency_key unique
  expires_at            <- رزرو معلق خودبه‌خود رها می‌شود
  created_at
```

### SQL اصل کار

```sql
UPDATE quota_counters
   SET reserved_value = reserved_value + $qty
 WHERE tenant_id = $tenant
   AND quota_key = $key
   AND period_start = $period
   AND used_value + reserved_value + $qty <= limit_value
RETURNING *;
```

اگر هیچ سطری برنگردد، سقف پر است. هیچ مسابقه‌ای ممکن نیست، چون شرط درون خود UPDATE است.

> این پنج خط SQL ارزشمندترین بخش فنی این سند است.

---

## ۱۸.۴ رزرو معلق

مشکل: فراخوانی AI رزرو می‌کند، پروسه کرش می‌کند، رزرو برای همیشه قفل می‌ماند.

راه‌حل:
- هر رزرو `expires_at` دارد (پیشنهاد: ۱۵ دقیقه)
- یک job هر دقیقه رزروهای منقضی را رها می‌کند
- هر رهاسازی در لاگ و متریک ثبت می‌شود

اگر تعداد رهاسازی بالا رفت، یعنی یک مسیر دارد مرتب می‌ترکد. این یک سیگنال عملیاتی عالی است.

---

## ۱۸.۵ کلیدهای سهمیه

```text
tenancy.members            gauge
commerce.products          gauge
commerce.orders_per_month  counter
storage.bytes              gauge
api.requests_per_month     counter
ai.credits_per_month       counter
email.sends_per_month      counter
automation.executions      counter
```

کاتالوگ کامل در `70-contracts/features-and-quotas.md`.

---

## ۱۸.۶ اندازه‌گیری مصرف

رخداد مصرف جدا از شمارنده است. دلیل: شمارنده برای تصمیم لحظه‌ای، رخداد برای صورتحساب و تحلیل.

```text
usage_events
  id, tenant_id, metric, quantity
  occurred_at, recorded_at
  source_type, source_id
  actor_user_id, correlation_id
  idempotency_key unique
  metadata jsonb
```

قواعد:
- append-only
- پارتیشن ماهانه در فاز بعد (جدول بزرگ‌ترین جدول سیستم خواهد شد)
- تجمیع شبانه در جدول خلاصه
- هرگز برای چک لحظه‌ای سقف از این جدول count نگیر

---

## ۱۸.۷ ریست دوره

دوره باید به دوره صورتحساب Subscription گره بخورد، نه به اول ماه تقویم.

مشتری که روز ۱۷ مشترک شده، سهمیه‌اش روز ۱۷ ماه بعد ریست می‌شود.
در غیر این صورت مشتری در ماه اول نصف سهمیه می‌گیرد و این دقیقاً تکت پشتیبانی می‌سازد.

---

## ۱۸.۸ معیار پذیرش

- تست همزمانی: ۵۰ درخواست موازی با سقف ۱۰ دقیقاً ۱۰ موفقیت می‌دهد
- تست: رزرو معلق پس از انقضا رها می‌شود
- تست: فراخوانی دوباره با همان idempotency key دو بار کم نمی‌کند
- تست: مقدار منفی هرگز در شمارنده ممکن نیست (constraint دیتابیس)
- متریک تعداد رهاسازی خودکار منتشر می‌شود
