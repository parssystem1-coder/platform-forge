# platform-forge

> ⚠️ **فاز جاری: `P-IDENTITY`** (Identity + Tenancy + Authorization)
>
> فاز قبلی `P-DEBT` با موفقیت بسته شد. تمام ۳۴ یافته کدی اصلاح شد.
> اسناد و نقشه فاز مرجع: `handbook/99-amendment/05-canonical-phase-map.md`

Spec, contracts, and data-layer blueprint for a multi-tenant SaaS platform —
plus a CI gate that verifies the **entire data chain** on every push and PR.

## Repository layout

| Path | What it is |
| --- | --- |
| `handbook/` | The platform handbook: architecture, product, data model, engineering standards, delivery plans, API/event contracts, ADRs, and the amendment register |
| `handbook/30-data/ddl/` | The SQL migration chain (bootstrap → phases → amendments) |
| `handbook/90-skeleton/` | Reference code skeleton (kernel, RLS tests, compose) |
| `.github/workflows/verify.yml` | The CI/CD gate (docs, contracts, full data chain) |
| `ci/db-full-verify.sh` | Full-push data verification: applies every migration to a fresh Postgres 16 and audits role/ownership/RLS invariants |

## Quick Start (Local Development)

### 1. Copy environment file

```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL_SUPER password
```

### 2. Start infrastructure

```bash
pnpm infra:up
```

### 3. Setup database (creates roles, runs all migrations)

```bash
pnpm db:setup
```

### 4. Run tenant-leak tests

```bash
pnpm test:tenant-leak
```

> **Windows/MINGW64 users**: The new `db:setup` script uses pure Node.js and doesn't depend on `psql`.
> If you encounter psql issues, use `node scripts/db-setup.mjs` instead.

## CI: full-push data verification

Every push to `main` and every pull request runs three jobs:

1. **docs** — markdown lint of the whole handbook.
2. **contracts** — OpenAPI validation of `handbook/70-contracts/openapi.yaml`.
3. **data / full migration chain** — spins up PostgreSQL 16 and:
   - applies `amendment/0000_bootstrap_roles.sql` as superuser (role model, ownership, default privileges),
   - applies all phase + amendment migrations **in canonical order** as `platform_migration`,
   - runs the P-DEBT validation suite as the untrusted `platform_app` role,
   - asserts the security invariants: no app role bypasses RLS, every table is owned by `platform_migration`, every tenant-bound table has `FORCE ROW LEVEL SECURITY`.

Run it locally against any empty Postgres:

```bash
PGHOST=localhost PGPORT=5432 PGDATABASE=platform \
PGSUPERUSER=postgres PGSUPERPASSWORD=*** \
bash ci/db-full-verify.sh
```

[![verify](https://github.com/parssystem1-coder/platform-forge/actions/workflows/verify.yml/badge.svg)](https://github.com/parssystem1-coder/platform-forge/actions/workflows/verify.yml)
