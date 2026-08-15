# سند اصلاحیه معماری و اجرا — نسخه ۳.۰

> تاریخ: 2026-08-15
> دامنه: کل بسته `handbook/`
> وضعیت بسته قبل از این اصلاحیه: `SPEC` گسترده + `SKELETON` ناقص، بدون هیچ artefact با وضعیت `IMPLEMENTED`

## این سند چه هست

نتیجه یک ممیزی کامل فایل‌به‌فایل روی ۱۶۷ فایل و ۱۱٬۱۲۶ خط از بسته. هر یافته با شاهد دقیق (مسیر فایل و شماره خط)، شدت، اثر واقعی و اصلاح اجرایی ثبت شده است. هیچ یافته‌ای بدون اصلاح رها نشده.

## این سند چه نیست

بازنویسی معماری نیست. **جهت‌گیری معماری این پروژه درست است** و در `11-kept-as-is.md` صریحاً فهرست شده که چه چیزهایی دست نخورده‌اند و چرا. آنچه اصلاح شده سه دسته است:

1. **حفره‌های امنیتی واقعی** در migrationها که ادعای isolation را باطل می‌کردند.
2. **باگ‌های اجرایی** در کدهای نمونه‌ای که هرگز اجرا نشده‌اند.
3. **تناقض‌های حاکمیتی** بین اسناد که Agent را به مسیر اشتباه می‌بردند.

## فهرست اصلاحیه

| فایل | محتوا |
|---|---|
| `01-findings-register.md` | رجیستری کامل ۳۴ یافته با شاهد، شدت و اصلاح |
| `02-critical-security-fixes.md` | ۹ یافته P0 امنیتی با SQL اصلاحی |
| `03-code-defects.md` | باگ‌های کد skeleton، خط به خط |
| `04-architecture-improvements.md` | ۷ تغییر معماری پیشنهادی با دلیل و ADR |
| `05-canonical-phase-map.md` | نقشه فاز واحد و مرجع، جایگزین سه نقشه متناقض |
| `06-doc-governance-and-restructure.md` | اصلاح ساختار پوشه‌ها و قانون ضد تورم سند |
| `07-execution-plan.md` | برنامه اجرایی ۴ اسپرینت با تسک ≤۴ ساعت |
| `08-acceptance-gate.md` | Gate واقعی با شاهد اجباری |
| `09-traceability.md` | ردیابی یافته ← تسک ← تست |
| `10-status-of-artifacts-corrected.md` | وضعیت واقعی هر artefact |
| `11-kept-as-is.md` | آنچه درست است و تغییر نکرد |
| `12-clickup-task-list.md` | لیست تسک اولویت‌دار، آماده ClickUp |

## فایل‌های اجرایی اضافه‌شده در این اصلاحیه

```text
30-data/ddl/amendment/0000_bootstrap_roles.sql      نقش‌های DB و grantها
30-data/ddl/amendment/0010_rls_hardening.sql        بستن ۹ حفره RLS
30-data/ddl/amendment/0011_ledger_integrity.sql     tenant_id و توازن دفتر
30-data/ddl/amendment/0012_outbox_hardening.sql     claim state و index
90-skeleton/apps/api/src/kernel/quota-service.ts    باگ interval و status
90-skeleton/apps/worker/src/outbox-publisher.ts     الگوی claim صحیح
90-skeleton/apps/api/src/kernel/authorization.ts    staff/machine/customer
90-skeleton/tests/helpers/*.ts                      harness واقعی
70-contracts/errors.md                              کاتالوگ کامل خطا
80-adr/0015..0021                                   ۷ ADR جدید
```

## ترتیب خواندن

۱. `02-critical-security-fixes.md` — اگر امروز فقط یک فایل می‌خوانی، همین است.
۲. `05-canonical-phase-map.md` — تا بدانی الان کجای پروژه‌ای.
۳. `07-execution-plan.md` — تا بدانی فردا چه می‌کنی.
۴. بقیه به ترتیب.
