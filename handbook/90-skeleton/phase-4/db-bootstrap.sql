-- Phase 4 bootstrap sketch. Run with a migration-owner role only.
-- Do not put real production passwords in source control.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'platform_app') THEN
    CREATE ROLE platform_app LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'platform_migration') THEN
    CREATE ROLE platform_migration LOGIN;
  END IF;
END $$;

-- The migration role owns schema objects.
GRANT USAGE ON SCHEMA public TO platform_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO platform_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO platform_app;

-- Explicitly prevent the two common RLS bypasses.
ALTER ROLE platform_app NOBYPASSRLS;
-- Never make platform_app the owner of application tables.
