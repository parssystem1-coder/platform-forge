# ترتیب اجرای واقعی بستن بدهی معماری

## هدف این سند

این فاز را از حالت فهرست کار خارج می‌کند و به ترتیب اجرایی تبدیل می‌کند. هیچ کار feature جدیدی قبل از Gate نهایی این سند شروع نمی‌شود.

## Step 1: Repository becomes runnable

```text
pnpm-workspace.yaml
package.json
pnpm-lock.yaml
turbo.json
tsconfig.base.json
apps/api
apps/worker
packages/config
packages/types
packages/testing
```

### پذیرش

- clone تمیز بدون فایل‌های محلی بالا می‌آید
- `pnpm install --frozen-lockfile` موفق است
- `pnpm build` هر دو app را build می‌کند
- `pnpm verify` از root قابل اجراست

## Step 2: Real API and Worker bootstrap

### API

- Nest application واقعی
- ConfigModule با schema
- global validation pipe
- Problem Details filter
- request/correlation middleware
- `/healthz` و `/readyz`
- graceful shutdown

### Worker

- process مستقل
- config مشترک از package
- handler registry
- graceful shutdown
- health signal

### پذیرش

- API و Worker مستقل start/stop می‌شوند
- worker به API import وابسته نیست، فقط package/contract مشترک دارد
- process termination job جدید claim نمی‌کند

## Step 3: Database role and migration bootstrap

```text
migration_owner
  -> create extensions, tables, policies, grants

application_role
  -> SELECT/INSERT/UPDATE/DELETE
  -> NOLOGIN? در production credential جدا
  -> NOT owner
  -> NOT BYPASSRLS
```

### پذیرش

- migration با role مالک اجرا می‌شود
- API فقط با application role وصل می‌شود
- query مالکیت جدول‌ها صفر است
- `rolbypassrls` برای application role false است
- migration دوم از صفر و روی دیتابیس موجود قابل اجراست

## Step 4: RLS hardening

برای هر جدول tenant-bound:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_name FORCE ROW LEVEL SECURITY;

CREATE POLICY table_name_select_write_policy
ON table_name
USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

### پذیرش

- SELECT خارج از context داده نمی‌دهد
- INSERT با tenant اشتباه fail می‌شود
- UPDATE نمی‌تواند tenant_id را به Tenant دیگر تغییر دهد
- DELETE فقط ردیف همان context را می‌بیند
- policy با role واقعی app تست می‌شود

## Step 5: Test harness

ساخت این helperها اجباری است:

```text
tests/helpers/database.ts
tests/helpers/fixtures.ts
tests/helpers/tenant.ts
tests/helpers/http.ts
tests/helpers/assertions.ts
```

### پذیرش

- هیچ import به helper فرضی وجود ندارد
- Testcontainers یا Compose واقعی در integration test استفاده می‌شود
- هر test دیتای خودش را دارد
- test order روی نتیجه اثر ندارد

## Step 6: Outbox hardening

تصمیم اجرایی:

- claim کوتاه‌مدت با transaction
- handler خارج از transaction claim اجرا می‌شود
- dedupe با `processed_events`
- موفقیت یا retry در update جدا ثبت می‌شود
- dead-letter بعد از سقف تلاش

### پذیرش

- crash بعد از claim باعث گم شدن event نمی‌شود
- duplicate publish اثر دوباره ندارد
- یک event stuck نمی‌تواند کل queue را قفل کند
- replay با dry-run و audit انجام می‌شود

## Step 7: Contract enforcement

CI باید این‌ها را fail کند:

- route بدون OpenAPI
- error code خارج از catalog
- event payload خارج از schema
- dependency boundary شکسته
- tenant table بدون RLS
- migration بدون naming/order معتبر

## Step 8: Agent governance

قبل از اولین کد Phase 2، Agent باید این چهار فایل را تولید و commit کند:

```text
PHASE_PLAN.md
OPEN_QUESTION.md یا اعلام No Open Questions
IMPLEMENTATION_REPORT.md
ARCHITECTURE_STATUS.md
```

## Gate نهایی

فقط وقتی Phase 4 بسته است که:

```text
clean clone
 + real API
 + real worker
 + real DB role
 + real RLS test
 + real outbox test
 + contract CI
 + agent templates
 = Phase 4 complete
```
