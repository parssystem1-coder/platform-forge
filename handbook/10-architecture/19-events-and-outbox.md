# ۱۹. رخداد و Outbox

## ۱۹.۱ مسئله

```text
الگوی غلط:
  await db.save(order);
  await bus.publish(OrderCreated);   <- اگر اینجا پروسه بمیرد؟
```

دو حالت فاجعه‌بار:
1. داده ذخیره شد ولی رخداد منتشر نشد: ایمیل تأیید نرفت، موجودی کم نشد
2. رخداد منتشر شد ولی تراکنش rollback شد: مصرف‌کننده دنبال رکوردی می‌گردد که وجود ندارد

---

## ۱۹.۲ راه‌حل: Outbox در همان تراکنش

```text
BEGIN
  INSERT INTO orders ...
  INSERT INTO outbox_events ...
COMMIT

[worker جداگانه]
  SELECT ... WHERE published_at IS NULL
  انتشار
  UPDATE published_at
```

ضمانت تحویل: **at-least-once**. پس هر مصرف‌کننده باید idempotent باشد.
این یک الزام است، نه توصیه.

---

## ۱۹.۳ پاکت رخداد

```json
{
  "id": "uuid",
  "eventType": "commerce.order.created",
  "eventVersion": 1,
  "aggregateType": "order",
  "aggregateId": "uuid",
  "tenantId": "uuid",
  "occurredAt": "2026-08-15T09:00:00Z",
  "correlationId": "uuid",
  "causationId": "uuid",
  "actor": { "kind": "user", "id": "uuid" },
  "payload": {}
}
```

### قواعد payload

1. فقط داده‌ی لازم. پاکت جای دومپ کردن کل رکورد نیست.
2. بدون داده حساس: رمز، توکن، شماره کارت.
3. تغییر ناسازگار یعنی `eventVersion` جدید، نه تغییر نسخه قدیمی.
4. نام رخداد زمان گذشته است: `created`, `updated`, `revoked`.

---

## ۱۹.۴ منطق Publisher

```text
هر ۲۰۰ms:
  SELECT * FROM outbox_events
   WHERE published_at IS NULL AND available_at <= now()
   ORDER BY occurred_at
   LIMIT 100
   FOR UPDATE SKIP LOCKED        <- کلید مقیاس‌پذیری چند worker
```

### مدیریت خطا

| تلاش | تأخیر بعدی |
|------|-------------|
| ۱ | ۵ ثانیه |
| ۲ | ۳۰ ثانیه |
| ۳ | ۵ دقیقه |
| ۴ | ۳۰ دقیقه |
| ۵ | ۲ ساعت |
| ۶+ | انتقال به dead letter و هشدار |

`FOR UPDATE SKIP LOCKED` باعث می‌شود چند worker بدون تداخل کار کنند. بدون این، با دو worker رخداد دو بار منتشر می‌شود.

---

## ۱۹.۵ ترتیب رخدادها

ترتیب جهانی وجود ندارد و لازم هم نیست. فقط ترتیب درون یک aggregate مهم است.

راه‌حل ساده: مرتب‌سازی بر اساس `(aggregateId, occurredAt)` و پردازش ترتیبی برای هر aggregate.

اگر تیم شروع کرد به طراحی ترتیب دقیق جهانی، این زنگ خطر است: دارید Kafka را با Postgres پیاده می‌کنید.

---

## ۱۹.۶ مصرف‌کننده‌ها در فازها

| مصرف‌کننده | فاز | کار |
|--------------|------|-----|
| Notification | ۳ | ارسال ایمیل |
| Read Model Projector | ۲ | به‌روزرسانی کاتالوگ فروشگاه |
| Metering | ۶ | ثبت مصرف |
| Webhook Dispatcher | ۷ | تحویل به بیرون |
| Automation | ۹ | اجرای جریان کار |
| Search Indexer | بعدتر | فقط اگر OpenSearch آمد |

مزیت این معماری: افزودن هر کدام، صفر تغییر در مسیر نوشتن می‌خواهد.

---

## ۱۹.۷ نگهداری جدول

جدول outbox باید کوچک بماند وگرنه تبدیل به گلوگاه می‌شود:

- رخدادهای منتشرشده پس از ۷ روز به جدول آرشیو منتقل می‌شوند
- ایندکس جزئی روی `published_at IS NULL`
- متریک طول صف و قدیمی‌ترین رخداد منتشرنشده منتشر می‌شود

هشدار: اگر قدیمی‌ترین رخداد منتشرنشده از ۶۰ ثانیه بگذرد، یعنی worker مرده است.

---

## ۱۹.۸ معیار پذیرش

- تست: اگر تراکنش rollback شود، رخدادی هم نیست
- تست: دو worker همزمان یک رخداد را دو بار منتشر نمی‌کنند
- تست: مصرف‌کننده با دریافت دوباره نتیجه را دو بار اعمال نمی‌کند
- تست: پس از ۶ خطا، رخداد به dead letter می‌رود
- متریک طول صف در داشبورد موجود است
