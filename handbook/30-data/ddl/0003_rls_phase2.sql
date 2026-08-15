-- Enable row level security on every tenant-bound table added in phase 2.
-- Run this immediately after 0002_commerce.sql. Never ship a tenant table without a policy.

DO $do$
DECLARE
  t text;
  tables text[] := ARRAY[
    'customers',
    'customer_sessions',
    'products',
    'product_variants',
    'inventory_items',
    'orders',
    'order_lines',
    'storefront_products',
    'quota_counters',
    'quota_reservations'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid)',
      t || '_rls_policy',
      t
    );
  END LOOP;
END
$do$;

-- Verification query. Any tenant-bound table missing from this result is a security hole.
--
-- SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
--   FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--  WHERE n.nspname = 'public'
--    AND c.relkind = 'r'
--  ORDER BY c.relname;
