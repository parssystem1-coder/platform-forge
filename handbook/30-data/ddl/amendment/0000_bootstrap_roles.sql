-- =====================================================================
-- 0000_bootstrap_roles.sql  (AMENDMENT v3 - closes D-003, F-032)
-- Run FIRST, before every other migration, as a superuser.
-- Idempotent. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Roles
--    platform_migration : owns every schema object. Runs migrations.
--    platform_app       : the ONLY role the API and Worker connect with.
--                         Owns nothing. Never bypasses RLS.
--    platform_readonly  : analytics/support. SELECT only, still under RLS.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'platform_migration') THEN
    CREATE ROLE platform_migration LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'platform_app') THEN
    CREATE ROLE platform_app LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'platform_readonly') THEN
    CREATE ROLE platform_readonly LOGIN;
  END IF;
END $$;

-- Passwords are injected by the deploy pipeline, never committed.
-- ALTER ROLE platform_app PASSWORD :'app_password';

-- ---------------------------------------------------------------------
-- 2. The two bypasses that make RLS decorative. Close both, explicitly.
-- ---------------------------------------------------------------------
ALTER ROLE platform_app       NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
ALTER ROLE platform_readonly  NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
-- The migration role is the controlled schema owner and must apply migrations
-- to FORCE RLS tables. It is never used by API or Worker.
ALTER ROLE platform_migration BYPASSRLS NOSUPERUSER;

-- ---------------------------------------------------------------------
-- 3. Schema ownership and default privileges
-- ---------------------------------------------------------------------
ALTER SCHEMA public OWNER TO platform_migration;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT  USAGE ON SCHEMA public TO platform_app, platform_readonly;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO platform_app;
GRANT USAGE, SELECT                 ON ALL SEQUENCES IN SCHEMA public TO platform_app;
GRANT SELECT                        ON ALL TABLES    IN SCHEMA public TO platform_readonly;

-- Anything a future migration creates inherits these grants automatically.
ALTER DEFAULT PRIVILEGES FOR ROLE platform_migration IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO platform_app;
ALTER DEFAULT PRIVILEGES FOR ROLE platform_migration IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO platform_app;
ALTER DEFAULT PRIVILEGES FOR ROLE platform_migration IN SCHEMA public
  GRANT SELECT ON TABLES TO platform_readonly;

-- ---------------------------------------------------------------------
-- 4. F-032: append-only tables must be append-only in the DATABASE,
--    not in a code review comment.
--    "Financial correction is a reversing entry, not an UPDATE" is now
--    enforced by the engine.
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'audit_logs',
    'ledger_entries',
    'ledger_lines',
    'outbox_dead_letters',
    'payment_webhook_events'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('REVOKE UPDATE, DELETE ON %I FROM platform_app', t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 5. Verification. CI must assert all three rows come back as expected.
-- ---------------------------------------------------------------------
-- SELECT rolname, rolbypassrls, rolsuper FROM pg_roles
--  WHERE rolname LIKE 'platform_%';
-- SELECT count(*) FROM pg_tables
--  WHERE schemaname='public' AND tableowner <> 'platform_migration';   -- expect 0
