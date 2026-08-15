# واژه‌نامه رسمی دامنه

| واژه | تعریف رسمی | نباید با این قاطی شود |
| --- | --- | --- |
| User | هویت انسانی پلتفرم | Customer |
| Customer | خریدار نهایی یک Tenant | User |
| Tenant | فضای کسب‌وکار مشتری | User |
| Membership | رابطه User و Tenant | Subscription |
| Role | مجموعه Permission | Plan |
| Permission | اجازه انجام عمل | Feature |
| Feature | قابلیت فعال برای Tenant | Permission |
| Quota | سقف یا مصرف منبع | Permission |
| Plan | بسته فروشی مفهومی | Subscription |
| PlanVersion | نسخه تغییرناپذیر Plan | Plan |
| Subscription | وضعیت خرید Tenant | Membership |
| Invoice | سند طلب | Ledger |
| Ledger Entry | ثبت دوطرفه مالی | Invoice |
| Usage Event | واقعیت مصرف | Quota Counter |
| Domain Event | واقعیت تغییر در دامنه | Integration Event |
| Outbox | صف پایدار انتشار رخداد | Event Bus |
| Read Model | مدل بهینه خواندن | Source of Truth |
| Application Service | اجرای یک عملیات کسب‌وکار | Controller |
| Adapter | اتصال به بیرون | Domain Rule |
