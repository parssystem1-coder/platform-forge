# ماتریس ردیابی: نیاز تا معماری تا تست

| نیاز | تصمیم معماری | قرارداد | تست پذیرش |
|---|---|---|---|
| User چند Tenant داشته باشد | User جدا از Tenant + Membership | ActorContext | چند membership برای یک User |
| نشت Tenant ممنوع باشد | RLS + withTenant | TenantContext | Tenant Leak Suite |
| Customer جدا باشد | Customer Realm | Customer API | ایمیل مشابه در دو Tenant |
| Downgrade داده حذف نکند | Feature/Quota روی create | Subscription contract | 5000 به 500 بدون delete |
| پرداخت تکراری نشود | Idempotency + webhook table | Payment events | webhook دوباره |
| رخداد گم نشود | Transactional Outbox | Event envelope | rollback بدون event |
| مصرف هم‌زمان امن باشد | Atomic reservation | Quota API | ۵۰ درخواست، ۱۰ موفق |
| Storefront سریع باشد | Read Model + CDN | Storefront read API | p95 و cache hit |
| AI provider قابل تعویض باشد | AI Gateway | AI request contract | provider fallback |
| Plugin امن باشد | SDK + Platform API | Manifest | دسترسی مستقیم DB ممنوع |
| API تغییرپذیر باشد | `/api/v1` و contract test | OpenAPI | drift check |
| Frontend با Backend همگام باشد | Generated SDK | OpenAPI | generated client build |
| بازیابی پس از خرابی ممکن باشد | PITR + restore test | Runbook | restore ماهانه |

## قانون استفاده

هر تسک جدید باید حداقل یک ردیف یا اصلاح یک ردیف داشته باشد. اگر نیاز در این ماتریس نیست، احتمالاً هنوز خوب تعریف نشده.
