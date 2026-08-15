# P-DEBT Completion Report

Date: 2026-08-15
Phase: `P-DEBT — Architecture Debt Closure & Foundation Hardening`
Gate result: **HOLD / NOT COMPLETE**

## Executive decision

P-DEBT is **not complete** and must not advance to Platform Core / Identity implementation yet. The amendment package was re-verified and red-teamed. Four concrete defects were found in the prior amendment package and fixed in this working tree, but the environment has no `docker`, `psql`, `node` or `pnpm`, so the mandatory real-PostgreSQL evidence cannot be produced.

This is the correct result. Marking the phase complete now would turn the documentation problem into a security problem.

## Re-verification performed

- Re-extracted the amended package from its delivered archive.
- Counted the repository: 202 files, 166 Markdown files.
- Read the full `99-amendment/` package, the status file, finding registry and traceability matrix.
- Inspected all amendment SQL files and the amended kernel code.
- Compared role ownership, FORCE RLS behavior, policy permissiveness, outbox worker access, ledger nullability and trigger types.
- Performed a focused red-team review across identity, tenancy, RLS, authorization, staff, worker, ledger, quota, idempotency, outbox, audit, errors, constraints and transaction boundaries.

## New findings discovered during re-verification

| ID | Severity | Finding | Status |
|---|---|---|---|
| RT-001 | S0 | `platform_migration` was `NOBYPASSRLS` while owning FORCE-RLS tables and had no policies for most migration operations. | Fixed: migration role is explicit `BYPASSRLS`; never used by applications. |
| RT-002 | S0 | Outbox `IS NOT DISTINCT FROM` app policies allowed no-context app access to platform-level rows. | Fixed: app policies require `tenant_id = app_current_tenant()`. |
| RT-003 | S1 | `ledger_lines` remained nullable and NULL was treated as a valid app-visible boundary. | Fixed: strict `NOT NULL`, with explicit preflight failure for legacy NULL lines. |
| RT-004 | S1 | Ledger balance trigger used a text variable for a currency count and repeated the query. | Fixed: typed integer count. |

## Task status, in source-of-truth order

| Task group | Status | Evidence / blocker |
|---|---|---|
| T-01..T-07, S0 database security | `CODE-READY / BLOCKED` | Amendment migrations exist and were red-team patched. No real PostgreSQL execution available. |
| T-08, workspace bootstrap | `PARTIAL / BLOCKED` | workspace files were added, but no lockfile or complete package manifests exist. `pnpm install --frozen-lockfile` cannot be proven. |
| T-09, API bootstrap | `BLOCKED` | `main.ts`, Nest DI, health endpoints and Problem Details filter are still missing. |
| T-10, worker bootstrap | `PARTIAL / BLOCKED` | publisher exists, but independent process, registry and graceful shutdown are missing. |
| T-11, migration runner | `BLOCKED` | no actual migration runner exists; only a placeholder package script and SQL files. |
| T-12, real tenant-leak suite | `PARTIAL / BLOCKED` | helpers now exist, but `pg`, test packages and a real database are unavailable. |
| T-13, single tenant path | `CODE-READY / BLOCKED` | single implementation and named scopes exist; boundary check has not run. |
| T-14..T-20, correctness and contracts | `CODE-READY / BLOCKED` | amended code and contracts exist; concurrency, drift and integration tests have not run. |
| T-21..T-26, governance and final gate | `DESIGNED / BLOCKED` | documents exist; no evidence can be signed until S0 and S1 execution passes. |

## Migrations

Present:

```text
30-data/ddl/amendment/0000_bootstrap_roles.sql
30-data/ddl/amendment/0010_rls_hardening.sql
30-data/ddl/amendment/0011_ledger_integrity.sql
30-data/ddl/amendment/0012_outbox_hardening.sql
```

Executed against PostgreSQL: **No**.

The explicit validation script is `90-skeleton/tests/sql/p-debt-validation.sql`. It covers forced RLS, empty/invalid context, cross-tenant CRUD expectations, worker scope, audit immutability, ledger balance, uniqueness, rollback, quota concurrency and outbox crash/retry scenarios. The script is evidence scaffolding until run by a real integration job.

## Tests executed

Static inspection and file-level verification: **Yes**.

Real PostgreSQL security tests: **No**.

Typecheck, lint, boundary test, OpenAPI drift, error-catalog drift, unit tests, integration tests, tenant-leak suite: **No**, because the execution environment lacks `node`, `pnpm`, `psql` and `docker`, and the repository still lacks a complete runnable workspace.

## Architecture result

Accepted decisions remain unchanged:

- greenfield modular SaaS
- Commerce as a domain, not platform identity
- shared PostgreSQL with RLS
- no schema-per-tenant
- storefront remains within the platform
- Identity in Platform Core
- authorization separate from quota
- explicit worker security boundary
- database-enforced ledger integrity

The only changes are hardening and clarification, recorded in ADRs 0015 through 0021 and the red-team review `99-amendment/13-red-team-review.md`.

## Findings closed vs open

Closed at design/code level: F-001 through F-034 have a mapped amendment, code or migration, and test target. This does **not** mean verified.

Open as verification blockers:

- all findings requiring real PostgreSQL evidence
- D-001, D-002 and D-005: runnable repository and harness
- D-008: actual OpenAPI drift enforcement
- T-09, T-10, T-11: API/worker/migration runtime
- concurrency and crash evidence for quota and outbox

## Gate checklist

- [ ] S0 findings closed with real database evidence
- [ ] every tenant-bound table proven isolated
- [ ] migrations applied successfully
- [ ] negative CRUD and WITH CHECK tests pass
- [ ] ledger rejects unbalanced state at COMMIT
- [ ] quota concurrency/idempotency passes
- [ ] outbox crash/retry/dedup passes
- [ ] API and Worker build and start
- [ ] clean clone passes frozen install and verify
- [ ] every completed finding has reproducible evidence

**Final decision: HOLD.** Fix the environment/repository execution blockers, run the real database suite, then repeat this Gate. Do not start Commerce or Identity implementation before PASS.
