# نقص‌های کد skeleton و اصلاح آن‌ها

## جمله‌ای که همه این باگ‌ها می‌گویند

هیچ کدام از این فایل‌ها هرگز اجرا نشده‌اند. نه یک بار. اگر یک بار `pnpm typecheck` رویشان اجرا شده بود، نیمی از این لیست در همان دقیقه پیدا می‌شد. این دقیقاً همان دلیلی است که D-001 و D-002 باید قبل از هر سند جدید بسته می‌شدند.

---

## C-1: `quota-service.ts` — «مهم‌ترین SQL پروژه» اجرا نمی‌شود

سه باگ در یک statement:

```sql
-- قبل (F-010، F-011، F-012)
insert into quota_reservations (..., status, idempotency_key, expires_at, created_at)
values (gen_random_uuid(), $1, $2, $3, $4, 5, $5, now() + interval 15, now())
--                                          ^          ^
--                                          |          سینتکس نامعتبر
--                                          عدد 5 در ستونی که CHECK متنی دارد

-- بعد
values (gen_random_uuid(), $1, $2, $3, $4, 'pending', $5,
        now() + interval '15 minutes', now())
```

دو اشکال منطقی هم که در ممیزی پیدا کردم و در لیست اولیه نبودند:

1. `commit()` و `release()` idempotent نبودند. یک retry بعد از timeout شبکه، `reserved_value` را دو بار کم می‌کرد و شمارنده را خراب می‌کرد. الان هر دو به `status = 'pending'` مقیدند و بار دوم no-op می‌شوند.
2. `commit(actualQuantity)` اگر بزرگتر از مقدار رزروشده بود، `used_value` را از `limit_value` عبور می‌داد؛ یعنی دقیقاً همان چیزی که رزرو اتمیک می‌خواست جلویش را بگیرد. الان خطا می‌دهد.

و یک بهبود تجربه کاربری: قبلاً «سقف پر شده» و «این مستاجر هیچ دوره فعالی برای این سهمیه ندارد» هر دو `QuotaExceeded` می‌دادند. اولی ۴۲۹ و فرصت upsell است، دومی ۴۰۹ و باگ خود ماست. الان جدا شدند.

## C-2: `outbox-publisher.ts` — الگوی غلط تراکنش (F-013، F-014، F-017)

مشکل اصلی: `publish` داخل تراکنش claim صدا زده می‌شد.

```text
قبل:  BEGIN → claim 100 row → publish ۱۰۰ تا (شبکه!) → update → COMMIT
       مشکل ۱: ۱۰۰ ردیف قفل‌شده به مدت تمام فراخوانی‌های شبکه
       مشکل ۲: یک خطای DB در انتها = rollback کل batch، در حالی که
                رخدادها واقعاً منتشر شده‌اند → انتشار دوباره

بعد:  TX1: claim + status='claimed' + lease 60s → COMMIT (فوری)
       خارج تراکنش: publish
       TX2: به ازای هر ردیف، یک تراکنش کوتاه: published | retry | dead
```

ایمنی در برابر crash از lease می‌آید: claimی که `claim_expires_at` اش گذشته، دوباره قابل گرفتن است. پس worker کشته‌شده چیزی گم نمی‌کند و یک رخداد stuck هم کل صف را قفل نمی‌کند. تحویل at-least-once می‌ماند، که همان دلیل وجود `processed_events` است.

F-014: دستور `insert into outbox_dead_letters select *, now() from outbox_events` فرض می‌کرد دو جدول هم‌شکلند. نیستند. الان تابع `outbox_dead_letter(event_id, error)` در SQL نگاشت را یکجا و قابل تست نگه می‌دارد.

F-017: `import ... from '../../api/src/kernel/unit-of-work'` حذف شد و به `@platform/contracts` رفت. مرزی که در سند نوشته بودی، در کد رعایت نشده بود.

## C-3: `authorization.ts` — سه مسیر از چهار مسیر کار نمی‌کند

این بدترین نوع باگ است: تابعی که قرار است تنها نقطه تصمیم باشد، برای سه تا از چهار نوع کاربری که مدل هویتی‌ات روی شان بنا شده، مسیر مجاز ندارد:

| نوع actor | رفتار قبلی | پیامد |
|---|---|---|
| `user` | کار می‌کرد | — |
| `machine` | scope چک می‌شد ولی `return` نداشت، بعد روی `!userId` می‌افتاد | هیچ API key کار نمی‌کرد (F-015) |
| `customer` | مستقیماً `throw Forbidden` | Storefront ناگزیر به دور زدن authorize (F-029) |
| `staff` | مسیری نداشت، به lookup عضویت می‌رفت که ندارد | Platform Admin غیرقابل ساخت (F-030) |

الان هر چهار مسیر صریح، مستقل و تست‌پذیرند، و دسترسی staff به داده مستاجر همیشه audit می‌شود. تغییر مهم دیگر: امضای خروجی از `Promise<void>` به `Promise<AuthorizationResult>` تغییر کرد تا سهمیه را به جای «خواندن و امیدوار بودن»، به Use Case برگرداند تا اتمیک رزرو شود (F-022).

## C-4: دو منبع حقیقت برای tenant context (F-016)

`kernel/unit-of-work.ts` و `db/tenant-db.ts` هر دو `withTenant` داشتند، با دو امضای متفاوت. دومی حتی بررسی خالی نبودن `tenantId` را نداشت. حذف شد.

و `withoutTenant` که escape hatch بود، به دو تابع باریک و نام‌دار تقسیم شد:

```text
withPlatform(userId, fn)     → فقط جدول‌های PLATFORM_WIDE_TABLES
withProvisioning(userId, fn) → تنها تراکنشی که مجاز است tenant بسازد
```

دلیل: «`withoutTenant` را کم استفاده کن» یک قانون نیست، یک آرزوست. دو تابع با نام مشخص و یک allowlist، قابل اجبار در CI است.

## C-5: harness تست وجود نداشت (D-005)

`tenant-leak.spec.ts` از `./helpers` import می‌کرد که وجود نداشت. پس «مهم‌ترین سوییت تست پروژه» قابل اجرا نبود. همین دلیل است که نه حفره RLS از هفت فاز مستندسازی جان سالم بردند.

`90-skeleton/tests/helpers/index.ts` الان وجود دارد و دو اتصال جدا دارد: `platform_app` برای سنجش و `platform_migration` برای fixture. اگر یک اتصال داشتی، تست دارد خودش را گول می‌زد.
