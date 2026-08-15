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

-- ----------------------------------------------------------------------
-- 1. Every tenant-bound table is FORCE RLS
-- ----------------------------------------------------------------------
DO $$
DECLARE missing text[];
BEGIN
  SELECT array_agg(DISTINCT c.relname ORDER BY c.relname) INTO missing
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
   WHERE n.nspname = 'public' AND c.relkind = 'r'
     AND a.attname = 'tenant_id' AND a.attnum > 0 AND NOT a.attisdropped
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

SELECT 'P-DEBT SQL assertions loaded; role/concurrency scenarios require the integration harness' AS evidence;
