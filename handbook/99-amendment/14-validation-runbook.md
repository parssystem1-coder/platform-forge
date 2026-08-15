# Runbook شواهد P-DEBT

## وضعیت این اجرا

**BLOCKED BEFORE DATABASE EXECUTION.** ماشین فعلی `docker`, `psql`, `node` و `pnpm` ندارد. بنابراین هیچ ادعای `IMPLEMENTED`, `TESTED` یا `VERIFIED` برای امنیت PostgreSQL، RLS، ledger، quota یا outbox پذیرفته نیست.

## اجرای لازم در CI

```bash
cd 90-skeleton
pnpm install --frozen-lockfile
pnpm infra:up
pnpm db:bootstrap
pnpm db:migrate
psql "$DATABASE_URL_OWNER" -f tests/sql/p-debt-validation.sql
pnpm test:tenant-leak
pnpm test:integration
pnpm verify
```

این دستورها فقط بعد از تکمیل T-08 تا T-12 معتبرند؛ در بسته فعلی `apps/api`, `apps/worker` bootstrap، package manifests، migration runner، lockfile و scripts drift هنوز کامل نیستند.

## شواهد اجباری

برای هر اجرا ذخیره شود:

- commit SHA
- `SELECT version()` و نسخه Postgres
- خروجی migrationها
- خروجی role/RLS audit
- گزارش tenant isolation
- گزارش ledger balance و rollback
- گزارش quota concurrency/idempotency
- گزارش outbox crash/retry/dead-letter
- خروجی `pnpm verify`
- نتیجه Gate با timestamp

## معیار توقف

اگر هر تست امنیتی fail شد یا هر خروجی بالا وجود نداشت، Gate نتیجه `HOLD` دارد. نبودن ابزار روی ماشین توسعه، خودش evidence اجرای موفق نیست.
