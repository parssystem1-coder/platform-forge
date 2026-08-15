-- =====================================================================
-- 0010_rls_hardening.sql  (AMENDMENT v3)
-- Closes: F-001 F-002 F-003 F-006 F-007 F-008 F-033 F-034 / debt D-004
--
-- Run as platform_migration, AFTER 0001..0009.
-- Every policy in this file uses the safe tenant expression:
--   nullif(current_setting('app.tenant_id', true), '')::uuid
-- An unset OR empty setting yields NULL, which matches zero rows,
-- instead of raising invalid-input-syntax and turning a safe path
-- into an error path.
-- =====================================================================

CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT nullif(current_setting('app.tenant_id', true), '')::uuid
$$;

COMMENT ON FUNCTION app_current_tenant() IS
  'Single source of the tenant predicate. Every RLS policy calls this and nothing else.';

-- ---------------------------------------------------------------------
-- SECTION 1 - F-001, F-002: the outbox tables were carrying tenant_id
-- with no RLS at all. Full event payloads of every tenant were readable
-- by the application role.
--
-- Design note: the outbox worker legitimately needs to read ACROSS
-- tenants. That is why it gets its own role instead of a policy hole.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'platform_worker') THEN
    CREATE ROLE platform_worker LOGIN NOBYPASSRLS NOSUPERUSER;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO platform_worker;
GRANT SELECT, INSERT, UPDATE ON outbox_events      TO platform_worker;
GRANT SELECT, INSERT         ON outbox_dead_letters TO platform_worker;
GRANT SELECT, INSERT, UPDATE ON processed_events    TO platform_worker;

ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events FORCE  ROW LEVEL SECURITY;

-- The API may only write an event for the tenant it is currently acting as,
-- and may only read its own. tenant_id IS NULL means a platform-level event.
DROP POLICY IF EXISTS outbox_events_app_policy ON outbox_events;
CREATE POLICY outbox_events_app_policy ON outbox_events
  FOR ALL TO platform_app
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

-- The worker publishes across tenants. Explicit, auditable, single role.
DROP POLICY IF EXISTS outbox_events_worker_policy ON outbox_events;
CREATE POLICY outbox_events_worker_policy ON outbox_events
  FOR ALL TO platform_worker
  USING (true) WITH CHECK (true);

ALTER TABLE outbox_dead_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_dead_letters FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outbox_dead_letters_app_policy ON outbox_dead_letters;
CREATE POLICY outbox_dead_letters_app_policy ON outbox_dead_letters
  FOR SELECT TO platform_app
  USING (tenant_id = app_current_tenant());

DROP POLICY IF EXISTS outbox_dead_letters_worker_policy ON outbox_dead_letters;
CREATE POLICY outbox_dead_letters_worker_policy ON outbox_dead_letters
  FOR ALL TO platform_worker
  USING (true) WITH CHECK (true);

-- processed_events is a consumer dedup table, not tenant data.
REVOKE ALL ON processed_events FROM platform_app;

-- ---------------------------------------------------------------------
-- SECTION 2 - F-006: every phase 1..3 policy had USING but no WITH CHECK.
-- Without WITH CHECK:
--   UPDATE products SET tenant_id = '<other-tenant>'   -- succeeded
--   INSERT INTO orders (tenant_id, ...) VALUES ('<other-tenant>', ...) -- succeeded
-- This rebuilds every tenant policy with both halves.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'memberships',
    'customers', 'customer_sessions',
    'products', 'product_variants', 'inventory_items',
    'orders', 'order_lines', 'storefront_products',
    'quota_counters', 'quota_reservations',
    'notification_preferences',
    'carts', 'cart_lines', 'inventory_reservations', 'payment_attempts',
    'tenant_plan_assignments', 'tenant_feature_overrides',
    'subscriptions', 'subscription_history',
    'invoices', 'invoice_lines', 'payments',
    'ledger_accounts', 'ledger_entries'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      RAISE NOTICE 'skip %, table not present yet', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE  ROW LEVEL SECURITY', t);

    -- drop every legacy policy name used across the old migrations
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_rls_policy',    t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_rls',           t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant_policy', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant_rls',    t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant_isolation', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_rls', t);

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO platform_app '
      'USING (tenant_id = app_current_tenant()) '
      'WITH CHECK (tenant_id = app_current_tenant())',
      t || '_tenant_isolation', t
    );
  END LOOP;
END $$;

-- notification_deliveries keeps a NULL-tenant path for platform mail,
-- but writing a NULL tenant row is no longer allowed from a tenant context.
DROP POLICY IF EXISTS notification_deliveries_tenant_rls ON notification_deliveries;
DROP POLICY IF EXISTS notification_deliveries_tenant_isolation ON notification_deliveries;
CREATE POLICY notification_deliveries_tenant_isolation ON notification_deliveries
  FOR ALL TO platform_app
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

-- ---------------------------------------------------------------------
-- SECTION 3 - F-007: audit_logs was readable with tenant_id IS NULL and
-- writable for ANY tenant. An audit trail you can forge is not an audit
-- trail. Split read from write, and make it insert-only.
-- ---------------------------------------------------------------------
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_rls_policy ON audit_logs;

CREATE POLICY audit_logs_read ON audit_logs
  FOR SELECT TO platform_app
  USING (tenant_id = app_current_tenant());

-- Writes must match the active tenant. No NULL smuggling, no cross-tenant.
CREATE POLICY audit_logs_write ON audit_logs
  FOR INSERT TO platform_app
  WITH CHECK (tenant_id = app_current_tenant());

-- Platform-scope audit rows (tenant_id IS NULL) belong to staff tooling only.
CREATE POLICY audit_logs_platform ON audit_logs
  FOR ALL TO platform_migration
  USING (true) WITH CHECK (true);

-- UPDATE/DELETE already revoked in 0000_bootstrap_roles.sql.

-- ---------------------------------------------------------------------
-- SECTION 4 - F-033: the tenants policy made registration impossible and
-- "list my tenants" unimplementable. Read through membership instead.
-- ---------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenants_rls_policy ON tenants;

-- a) inside a tenant context: the active tenant only
CREATE POLICY tenants_active_context ON tenants
  FOR ALL TO platform_app
  USING      (id = app_current_tenant())
  WITH CHECK (id = app_current_tenant());

-- b) outside a tenant context (login, tenant switcher, registration):
--    only the tenants the current user actually belongs to.
--    app.user_id is set with SET LOCAL by the same unit of work.
CREATE POLICY tenants_membership_read ON tenants
  FOR SELECT TO platform_app
  USING (
    app_current_tenant() IS NULL
    AND EXISTS (
      SELECT 1 FROM memberships m
       WHERE m.tenant_id = tenants.id
         AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid
         AND m.status  = 'active'
    )
  );

-- c) provisioning a brand new tenant happens in withProvisioning(),
--    a narrow unit of work that sets app.provisioning = 'on'.
CREATE POLICY tenants_provisioning_insert ON tenants
  FOR INSERT TO platform_app
  WITH CHECK (nullif(current_setting('app.provisioning', true), '') = 'on');

-- memberships needs the same escape for the very first owner row.
CREATE POLICY memberships_provisioning_insert ON memberships
  FOR INSERT TO platform_app
  WITH CHECK (nullif(current_setting('app.provisioning', true), '') = 'on');

-- and the tenant switcher must read its own memberships without a tenant.
CREATE POLICY memberships_self_read ON memberships
  FOR SELECT TO platform_app
  USING (
    app_current_tenant() IS NULL
    AND user_id = nullif(current_setting('app.user_id', true), '')::uuid
  );

-- ---------------------------------------------------------------------
-- SECTION 5 - F-034: circular FK between sessions and refresh tokens.
-- ---------------------------------------------------------------------
ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_current_refresh_token_fk;
ALTER TABLE sessions
  ADD  CONSTRAINT sessions_current_refresh_token_fk
  FOREIGN KEY (current_refresh_token_id)
  REFERENCES session_refresh_tokens(id)
  DEFERRABLE INITIALLY DEFERRED;

-- ---------------------------------------------------------------------
-- SECTION 6 - the guard the whole handbook depends on.
-- Any tenant_id table without FORCE RLS fails the migration itself,
-- so this class of bug can never ship again.
-- ---------------------------------------------------------------------
DO $$
DECLARE missing text[];
BEGIN
  SELECT array_agg(DISTINCT c.relname ORDER BY c.relname) INTO missing
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND a.attname = 'tenant_id' AND a.attnum > 0 AND NOT a.attisdropped
     AND (c.relrowsecurity = false OR c.relforcerowsecurity = false);

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'tenant-bound tables without FORCE RLS: %', missing;
  END IF;
END $$;

