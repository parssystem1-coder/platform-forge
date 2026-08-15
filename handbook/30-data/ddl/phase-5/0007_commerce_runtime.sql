-- Phase 5 runtime schema. Apply only after Phase 4 DB/RLS closure.
-- These tables are deliberately separate from the planning-only schemas so the
-- implementation migration can be reviewed independently.

CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NULL REFERENCES customers(id),
  guest_session_id uuid NULL,
  status text NOT NULL CHECK (status IN ('active', 'converted', 'abandoned')),
  currency text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT carts_owner_check CHECK (customer_id IS NOT NULL OR guest_session_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS cart_lines (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES product_variants(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  added_price_minor bigint NOT NULL CHECK (added_price_minor >= 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, cart_id, variant_id)
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES product_variants(id),
  order_id uuid NULL REFERENCES orders(id),
  quantity bigint NOT NULL CHECK (quantity > 0),
  status text NOT NULL CHECK (status IN ('pending', 'committed', 'released', 'expired')),
  idempotency_key text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id),
  provider text NOT NULL,
  provider_reference text NULL,
  status text NOT NULL CHECK (status IN ('created', 'pending', 'succeeded', 'failed')),
  idempotency_key text NOT NULL UNIQUE,
  failure_code text NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS carts_owner_idx ON carts(tenant_id, customer_id, status);
CREATE INDEX IF NOT EXISTS cart_lines_cart_idx ON cart_lines(tenant_id, cart_id);
CREATE INDEX IF NOT EXISTS inventory_reservation_expiry_idx ON inventory_reservations(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS payment_attempt_order_idx ON payment_attempts(tenant_id, order_id);

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts FORCE ROW LEVEL SECURITY;
CREATE POLICY carts_tenant_policy ON carts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE cart_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_lines FORCE ROW LEVEL SECURITY;
CREATE POLICY cart_lines_tenant_policy ON cart_lines
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations FORCE ROW LEVEL SECURITY;
CREATE POLICY inventory_reservations_tenant_policy ON inventory_reservations
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts FORCE ROW LEVEL SECURITY;
CREATE POLICY payment_attempts_tenant_policy ON payment_attempts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
