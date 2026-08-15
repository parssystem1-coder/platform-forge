DO $cleanup$
DECLARE
  t text;
  p record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tenants','memberships',
    'customers','customer_sessions','products','product_variants',
    'inventory_items','orders','order_lines','storefront_products',
    'quota_counters','quota_reservations',
    'notification_preferences','notification_deliveries',
    'carts','cart_lines','inventory_reservations','payment_attempts',
    'tenant_plan_assignments','tenant_feature_overrides',
    'subscriptions','subscription_history','invoices','invoice_lines',
    'payments','ledger_accounts','ledger_entries','reconciliation_runs'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;
END
$cleanup$;