-- Emergency fix: Add missing RLS policies for products and orders
-- These tables have RLS enabled but no policies were created

-- Ensure RLS is enabled and forced
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS products_tenant_isolation ON products;
DROP POLICY IF EXISTS orders_tenant_isolation ON orders;
DROP POLICY IF EXISTS customers_tenant_isolation ON customers;

-- Create policies for products
CREATE POLICY products_tenant_isolation ON products
  FOR ALL TO platform_app
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

-- Create policies for orders
CREATE POLICY orders_tenant_isolation ON orders
  FOR ALL TO platform_app
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

-- Create policies for customers
CREATE POLICY customers_tenant_isolation ON customers
  FOR ALL TO platform_app
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO platform_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO platform_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO platform_app;
