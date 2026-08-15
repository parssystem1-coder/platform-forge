# معماری Reliability فاز ۳

## ۱. حداقل تضمین‌های تحویل

سیستم Event Bus با تضمین **at-least-once** کار می‌کند. بنابراین «دقیقاً یک‌بار» ادعا نمی‌کنیم؛ به‌جایش همه consumerها idempotent هستند.

```text
at-least-once delivery
 + idempotent consumer
 + deduplication key
 + audit trail
 = رفتار قابل اتکا
```

## ۲. انواع شکست

| شکست | رفتار صحیح |
| --- | --- |
| API بعد از commit crash کند | Outbox event باقی می‌ماند |
| Worker هنگام handler crash کند | event دوباره اجرا می‌شود ولی اثر تکراری ندارد |
| Email provider قطع شود | retry و backlog، بدون rollback داده اصلی |
| Read Model خراب شود | rebuild از event/source ممکن است |
| Redis پاک شود | داده اصلی سالم می‌ماند |
| Mail template اشتباه باشد | نسخه template و audit قابل ردیابی است |

## ۳. طبقه‌بندی خطا

```text
Transient
  timeout, 429, connection reset
  -> retry with backoff

Permanent
  invalid recipient, invalid schema, unsupported event
  -> dead letter + alert

Unknown
  -> retry محدود، سپس dead letter
```

## ۴. ساختار Job

```ts
interface JobHandler<T> {
  type: string;
  handle(input: T, context: JobContext): Promise<void>;
}

interface JobContext {
  jobId: string;
  eventId: string;
  attempt: number;
  correlationId: string;
  signal: AbortSignal;
}
```

Handler نباید خودش transaction یا business rule موازی بسازد؛ اگر تغییر دامنه لازم است، Use Case رسمی را صدا می‌زند.

## ۵. Idempotency consumer

هر handler قبل از اثرگذاری این کلید را بررسی می‌کند:

```text
consumer_name + event_id
```

اگر قبلاً processed شده:

- هیچ side effect جدیدی ایجاد نمی‌شود
- نتیجه `already_processed` ثبت می‌شود
- metric duplicate بالا می‌رود

## ۶. Replay

Replay فقط با این مراحل مجاز است:

```text
operator selects event/dead-letter
 -> dry-run
 -> permission check
 -> audit replay request
 -> execute handler
 -> audit result
```

Replay کورکورانه روی کل جدول ممنوع.
