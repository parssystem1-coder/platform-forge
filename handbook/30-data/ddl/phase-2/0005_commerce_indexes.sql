-- Phase 2 indexes and integrity helpers.
-- Run after 0002_commerce.sql and 0003_rls_phase2.sql.

CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS inventory_available_idx ON inventory_items(tenant_id, variant_id);
CREATE INDEX IF NOT EXISTS order_lines_order_idx ON order_lines(tenant_id, order_id);
CREATE INDEX IF NOT EXISTS customer_sessions_active_idx ON customer_sessions(tenant_id, customer_id) WHERE status = 'active';

-- Prevent negative order totals and invalid line math at the database boundary.
ALTER TABLE orders ADD CONSTRAINT orders_money_nonnegative CHECK (
  subtotal_minor >= 0 AND tax_minor >= 0 AND total_minor >= 0
);
ALTER TABLE order_lines ADD CONSTRAINT order_lines_money_nonnegative CHECK (
  unit_price_minor >= 0 AND total_minor >= 0
);
