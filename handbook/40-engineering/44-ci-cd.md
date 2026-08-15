# 13. CI/CD

## 13.1 هدف

CI باید صرفاً lint runner نباشد. باید جلوی خراب شدن architecture را بگیرد.

---

## 13.2 Pipeline پیشنهادی PR

1. install dependencies
2. lint
3. typecheck
4. unit tests
5. integration tests
6. e2e tests
7. architecture boundary checks
8. OpenAPI drift check
9. migration sanity check
10. dependency vulnerability scan

---

## 13.3 Migration policy

- migrationها در PR review می‌شوند
- هر migration باید idempotent-ish deployment safe باشد
- destructive migration در گام اول ممنوع مگر با plan واضح

### deploy sequence

1. build artifact
2. run migrations
3. start new version
4. readiness pass
5. shift traffic

اگر migration backward compatible نیست، deploy دو مرحله‌ای لازم است.

---

## 13.4 Environments

- local
- test
- staging
- production

staging باید تا حد ممکن production-like باشد، مخصوصاً در auth و cookies.

---

## 13.5 Secrets in CI

- injected securely
- masked in logs
- short-lived tokens preferred

---

## 13.6 Release quality gates

برای release شدن staging/prod:

- verify سبز
- migration review approved
- security-sensitive diff reviewed by second engineer
- rollback plan documented if auth/session touched

---

## 13.7 وضعیت پیاده‌سازی

> به‌روزرسانی 2026-08-15 — این بخش دیگر SPEC نیست. Pipeline زیر در مخزن وجود دارد و روی هر push به `main` و هر PR اجرا می‌شود: `.github/workflows/verify.yml`.

سه job:

1. **docs** — lint کل `handbook/**/*.md` با markdownlint (کانفیگ: `.markdownlint.jsonc` در ریشه مخزن).
2. **contracts** — اعتبارسنجی `70-contracts/openapi.yaml` با Redocly؛ هر error باعث شکست job می‌شود.
3. **data / full migration chain** — پوش کامل داده روی PostgreSQL 16 تازه:
   - `ci/db-full-verify.sh` ابتدا `amendment/0000_bootstrap_roles.sql` را با superuser اجرا می‌کند (نقش‌ها، مالکیت schema، default privileges).
   - سپس همه migrationهای phase و amendment را به ترتیب مرجع با نقش `platform_migration` اعمال می‌کند.
   - suite اعتبارسنجی P-DEBT (`90-skeleton/tests/sql/p-debt-validation.sql`) با نقش غیرقابل‌اعتماد `platform_app` اجرا می‌شود.
   - در پایان سه invariant حسابرسی و assert می‌شود:
     - هیچ نقش اجرایی (`platform_app`، `platform_worker`، `platform_readonly`) `BYPASSRLS` یا superuser ندارد.
     - همه جدول‌های schema `public` متعلق به `platform_migration` هستند.
     - هر جدول tenant-bound هم `ENABLE` و هم `FORCE ROW LEVEL SECURITY` دارد.

هر statement با `ON_ERROR_STOP=1` اجرا می‌شود؛ هر شکست، pipeline را قرمز می‌کند.

اجرای محلی روی هر Postgres خالی:

```bash
PGHOST=localhost PGPORT=5432 PGDATABASE=platform \
PGSUPERUSER=postgres PGSUPERPASSWORD=*** \
bash ci/db-full-verify.sh
```
