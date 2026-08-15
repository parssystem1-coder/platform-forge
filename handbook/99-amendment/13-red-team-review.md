# P-DEBT Red-Team Review, 2026-08-15

## Result

The previous amendment package was **not safe to execute unchanged**. This review found three blockers before PostgreSQL validation:

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| RT-001 | S0 | `platform_migration` was `NOBYPASSRLS`, but it owns `FORCE ROW LEVEL SECURITY` tables and had no policies for most tables. Migrations and fixtures would fail or silently become untestable. | Set the migration role to `BYPASSRLS`; keep API, readonly and worker roles `NOBYPASSRLS`. Migration role is never an application credential. |
| RT-002 | S0 | Outbox app policies used `IS NOT DISTINCT FROM`, allowing an app connection with no tenant context to read/write platform-level outbox rows (`tenant_id IS NULL`). | Normal app access now requires `tenant_id = app_current_tenant()`. Cross-tenant worker access is explicit and isolated to `platform_worker`. |
| RT-003 | S1 | `ledger_lines` remained nullable after backfill while its RLS policy treated NULL as a valid app context. The ledger boundary was not strict. | `ledger_lines.tenant_id` is now `NOT NULL`; platform-owned entries are not app-visible. |
| RT-004 | S1 | The balance trigger assigned `count(DISTINCT currency)` into a text variable and then repeated the query. It was needlessly type-ambiguous. | Replaced with an integer `v_currency_count` used directly. |

## Decisions deliberately not changed

The red-team review confirms the accepted direction: shared PostgreSQL with RLS, no schema-per-tenant, modular monolith, separate customer realm, separate worker boundary, and database-enforced ledger integrity.

## Validation status

This is a **static red-team result**, not PostgreSQL evidence. The environment used for this review has no `docker`, `psql`, `node`, or `pnpm` executable. P-DEBT cannot pass until the same migrations and tests run on a real PostgreSQL instance in CI or a developer environment.

## Required next evidence

1. Apply base migrations `0001` through `0009`.
2. Apply amendment migrations `0000`, `0010`, `0011`, `0012` in an explicit documented order.
3. Run role, RLS, ledger, quota, outbox and rollback tests using real connections.
4. Capture the command, commit, database version, migration output and test output.
