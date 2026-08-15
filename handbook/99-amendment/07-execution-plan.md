# برنامه اجرایی فاز P-DEBT

> هیچ تسکی بزرگتر از ۴ ساعت نیست، مطابق قانون خودت.
> تخمین کل: ۲ تا ۳ هفته برای یک نفر، ۱ تا ۱.۵ هفته برای دو نفر.

## ترتیب غیرقابل مذاکره

```text
S0 امنیت دیتابیس   →  S1 مخزن قابل اجرا  →  S2 درستی کد  →  S3 حاکمیت
```

دلیل این ترتیب برعکس انتطار است: معمولاً می‌گویند اول مخزن را قابل اجرا کن. اما اگر اول مخزن را راه بیندازی، در همان روز روی schemaی کد می‌زنی که نه حفره امنیتی دارد، و مهاجرت بعدی دردناک‌تر می‌شود. schema اول.

---

## Sprint 0: امنیت دیتابیس (حدود ۲ روز)

خروجی قابل نمایش: دو کوئری طلایی `02-critical-security-fixes.md` صفر ردیف بدهند.

| تسک | کار | یافته | تخمین |
|---|---|---|---|
| T-01 | اجرای `0000_bootstrap_roles.sql` و جدا کردن نقش app از owner | D-003، F-032 | 3h |
| T-02 | RLS دو جدول outbox با نقش جداگانه `platform_worker` | F-001، F-002 | 3h |
| T-03 | افزودن `WITH CHECK` به تمام پالیسی‌های فاز ۱ تا ۳ | F-006 | 3h |
| T-04 | امن‌سازی `audit_logs`: پالیسی read/insert جدا + revoke | F-007 | 2h |
| T-05 | `tenant_id` و RLS و trigger توازن روی دفتر مالی | F-004، F-005، F-009، F-031 | 4h |
| T-06 | تابع `app_current_tenant()` و جایگزینی در همه پالیسی‌ها | F-008 | 2h |
| T-07 | اصلاح پالیسی `tenants` و مسیر provisioning | F-033 | 4h |

معیار پایان Sprint 0:

```sql
-- هر سه باید مقدار مورد انتطار بدهند
SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tableowner='platform_app';      -- 0
SELECT rolbypassrls FROM pg_roles WHERE rolname='platform_app';                              -- false
SELECT count(*) FROM pg_policies WHERE schemaname='public'
  AND cmd IN ('ALL','INSERT','UPDATE') AND with_check IS NULL;                               -- 0
```

---

## Sprint 1: مخزن قابل اجرا (حدود ۴ روز)

خروجی قابل نمایش: روی یک ماشین تازه، این دنباله بدون دستکاری کار کند:

```bash
git clone && pnpm install --frozen-lockfile && pnpm verify
docker compose up -d && pnpm db:bootstrap && pnpm db:migrate
pnpm test:tenant-leak      # سبز
curl localhost:3000/healthz # 200
```

| تسک | کار | یافته | تخمین |
|---|---|---|---|
| T-08 | workspace واقعی: `pnpm-workspace.yaml`، `turbo.json`، `tsconfig.base.json`، lockfile | D-002 | 4h |
| T-09 | API واقعی NestJS: bootstrap، ConfigModule، validation pipe، Problem Details filter، `/healthz`، `/readyz` | D-001 | 4h |
| T-10 | Worker مستقل: handler registry، graceful shutdown، health signal | D-001، D-009 | 4h |
| T-11 | migration runner و `pnpm db:reset` قابل تکرار | D-002 | 3h |
| T-12 | test harness واقعی و سبز کردن tenant-leak روی Postgres واقعی | D-005، F-003 | 4h |
| T-13 | حذف `tenant-db.ts`، یکی کردن `withTenant`، جایگزینی `withoutTenant` با دو تابع نام‌دار و lint rule | F-016، F-027 | 3h |

---

## Sprint 2: درستی کد (حدود ۴ روز)

| تسک | کار | یافته | تخمین |
|---|---|---|---|
| T-14 | رفع سه باگ `quota-service` + تست همزمانی واقعی (۲۰ رزرو موازی روی سقف ۱۰) | F-010، F-011، F-012 | 4h |
| T-15 | بازنویسی outbox publisher با claim lease + تست crash و تست duplicate | F-013، F-014، D-006 | 4h |
| T-16 | اصلاح `authorize`: مسیر machine، مسیر staff با audit، `authorizeCustomer` | F-015، F-029، F-030 | 4h |
| T-17 | حذف سهمیه از `authorize` و انتقال رزرو به Use Case | F-022 | 3h |
| T-18 | انتقال type مشترک به `packages/contracts` و قرمز کردن مرزها در CI | F-017 | 3h |
| T-19 | کاتالوگ خطای v2 + تست drift دوطرفه | F-020 | 3h |
| T-20 | `openapi.yaml` تنها مرجع + route drift test در CI | F-021، D-008 | 4h |

---

## Sprint 3: حاکمیت و پاکسازی (حدود ۲ روز)

| تسک | کار | یافته | تخمین |
|---|---|---|---|
| T-21 | اعمال نقشه فاز واحد و پاکسازی هفت «فاز جاری» در README | F-023، F-024 | 2h |
| T-22 | بازسازی پوشه‌های delivery در یک commit با اصلاح لینک‌ها | F-025، F-026 | 3h |
| T-23 | اصلاح معنای تیک در completeness-check و پر کردن `ARCHITECTURE_STATUS.md` | F-019 | 2h |
| T-24 | sequence شماره سفارش به ازای مستاجر + تست همزمانی | F-028 | 3h |
| T-25 | deferrable کردن FK نشست و توکن | F-034 | 1h |
| T-26 | Gate فاز P-DEBT: امضای شواهد و اجازه رسمی شروع P-IDENTITY | F-018 | 2h |

---

## کارهایی که عمداً در این فاز نیستند

Billing، AI، Plugin، Marketplace، پرداخت واقعی، دامنه اختصاصی، و هر سند جدید فاز. اگر در میانه این فاز وسوسه شدی یک سند جدید بنویسی، همین وسوسه ما را به اینجا رسانده.
