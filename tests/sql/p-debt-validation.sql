-- P-DEBT real PostgreSQL validation suite
--
-- Run this as part of a psql-backed integration job, not as a mock.
-- The harness must create two connections:
--   app:   platform_app
--   worker: platform_worker
-- and a separate migration connection for fixtures.
-- Any assertion failure must abort the job.

\set ON_ERROR_STOP on

-- ----------------------------------------------------------------------
-- 0. Role boundary
-- ----------------------------------------------------------------------
DO $$
BEGIN
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'validation must not run as superuser';
  END IF;
END $$;

-- Execute these checks through a migration-owner/admin connection:
-- SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname IN
--   ('platform_app','platform_worker','platform_readonly');
-- Expected: false, false, false.

-- ----------------------------------------------------------------------
-- 1. Every tenant-bound table is FORCE RLS
-- ----------------------------------------------------------------------
DO $$
DECLARE missing text[];
BEGIN
  SELECT array_agg(DISTINCT c.relname ORDER BY c.relname) INTO missing
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN information_schema.columns col
      ON col.table_schema = n.nspname AND col.table_name = c.relname
   WHERE n.nspname = 'public' AND c.relkind = 'r'
     AND col.column_name = 'tenant_id'
     AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity);
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'tenant tables without forced RLS: %', missing;
  END IF;
END $$;

-- ----------------------------------------------------------------------
-- 2. Empty and invalid tenant contexts
-- ----------------------------------------------------------------------
SELECT set_config('app.tenant_id', '', true);
SELECT app_current_tenant();
-- Expected: NULL, no cast error.

SELECT set_config('app.tenant_id', 'not-a-uuid', true);
DO $$
BEGIN
  BEGIN
    PERFORM app_current_tenant();
    RAISE EXCEPTION 'invalid UUID context unexpectedly accepted';
  EXCEPTION WHEN invalid_text_representation THEN
    NULL; -- expected rejection, never a silent broadening of access
  END;
END $$;

-- ----------------------------------------------------------------------
-- 3. The test runner executes the following scenarios in separate
--    app-role connections with real UUID fixtures.
-- ----------------------------------------------------------------------
-- A. set_config('app.tenant_id', tenant_a, true); SELECT products;
--    assert every tenant_id = tenant_a and tenant_b rows absent.
-- B. same context; INSERT products tenant_b; assert RLS error.
-- C. same context; UPDATE product_a SET tenant_id=tenant_b; assert error.
-- D. same context; DELETE product_b; assert zero rows affected.
-- E. no context; SELECT products; assert zero rows.
-- F. app context; SELECT outbox_events/outbox_dead_letters/ledger_lines;
--    assert only tenant_a.
-- G. worker connection; SELECT pending outbox across tenants; assert allowed
--    only on worker role and denied through platform_app.
-- H. update/delete audit_logs and ledger_lines through app; assert denied.

-- ----------------------------------------------------------------------
-- 4. Ledger invariants, executed in real transactions
-- ----------------------------------------------------------------------
-- BEGIN; insert an entry with one debit line; COMMIT; must fail.
-- BEGIN; insert debit 100 and credit 99; COMMIT; must fail.
-- BEGIN; insert debit 100 and credit 100 with same tenant/currency; COMMIT; pass.
-- BEGIN; insert same (tenant, source_type, source_id) twice; must fail.
-- ROLLBACK after a failed ledger transaction; assert no lines remain.

-- ----------------------------------------------------------------------
-- 5. Quota concurrency is implemented in the TypeScript integration
--    suite because the race uses 20 concurrent app transactions. It must:
--      - configure limit=10
--      - issue 20 reserve calls concurrently
--      - observe exactly 10 successes
--      - replay each successful idempotency key and observe same reservation
--      - replay commit/release and observe no counter change
--      - kill/rollback one transaction and verify reservation is absent
-- ----------------------------------------------------------------------

-- ----------------------------------------------------------------------
-- 6. Outbox crash and idempotency scenarios
-- ----------------------------------------------------------------------
-- Claim rows in TX1, commit, kill worker before publish; wait lease; claim again.
-- Assert row is not lost.
-- Publish once, mark once, replay same event to a dedup consumer.
-- Assert processed_events primary key prevents duplicate effect.
-- Fail MAX_ATTEMPTS times; assert explicit dead-letter mapping and status=dead.

SELECT 'P-DEBT SQL assertions loaded; role/concurrency scenarios require the integration harness' AS evidence;
