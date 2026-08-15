-- Phase 2: Commerce MVP, storefront customer realm, read model, inventory, quota

CREATE TABLE customers (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email citext NOT NULL,
  email_verified_at timestamptz NULL,
  password_hash text NULL,
  phone text NULL,
  display_name text NOT NULL,
  marketing_consent_at timestamptz NULL,
  status text NOT NULL CHECK (status IN ('guest', 'active', 'blocked')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT customers_tenant_email_unique UNIQUE (tenant_id, email)
);

CREATE TABLE customer_sessions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL
);

CREATE TABLE products (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug citext NOT NULL,
  title text NOT NULL,
  description text NULL,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'archived')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT products_tenant_slug_unique UNIQUE (tenant_id, slug)
);

CREATE TABLE product_variants (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text NOT NULL,
  price_minor bigint NOT NULL CHECK (price_minor >= 0),
  currency text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT variants_tenant_sku_unique UNIQUE (tenant_id, sku)
);

CREATE TABLE inventory_items (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  on_hand bigint NOT NULL CHECK (on_hand >= 0),
  reserved bigint NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, variant_id),
  CONSTRAINT inventory_reserved_within_on_hand CHECK (reserved <= on_hand)
);

CREATE TABLE orders (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NULL REFERENCES customers(id),
  number text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'fulfilled', 'canceled', 'refunded')),
  subtotal_minor bigint NOT NULL,
  tax_minor bigint NOT NULL DEFAULT 0,
  total_minor bigint NOT NULL,
  currency text NOT NULL,
  placed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT orders_tenant_number_unique UNIQUE (tenant_id, number)
);

CREATE TABLE order_lines (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES product_variants(id),
  title_snapshot text NOT NULL,
  unit_price_minor bigint NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  total_minor bigint NOT NULL
);

CREATE TABLE storefront_products (
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  slug citext NOT NULL,
  status text NOT NULL,
  payload jsonb NOT NULL,
  search_vector tsvector NULL,
  version bigint NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, product_id)
);

CREATE UNIQUE INDEX storefront_products_slug_idx ON storefront_products (tenant_id, slug);
CREATE INDEX storefront_products_search_idx ON storefront_products USING GIN (search_vector);

CREATE TABLE quota_counters (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quota_key text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  limit_value bigint NOT NULL,
  used_value bigint NOT NULL DEFAULT 0 CHECK (used_value >= 0),
  reserved_value bigint NOT NULL DEFAULT 0 CHECK (reserved_value >= 0),
  PRIMARY KEY (tenant_id, quota_key, period_start)
);

CREATE TABLE quota_reservations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quota_key text NOT NULL,
  period_start timestamptz NOT NULL,
  quantity bigint NOT NULL CHECK (quantity > 0),
  status text NOT NULL CHECK (status IN ('pending', 'committed', 'released')),
  idempotency_key text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX quota_reservations_stale_idx ON quota_reservations (expires_at) WHERE status = 'pending';

CREATE INDEX orders_tenant_placed_idx ON orders (tenant_id, placed_at DESC);
CREATE INDEX products_tenant_status_idx ON products (tenant_id, status);
CREATE INDEX customers_tenant_created_idx ON customers (tenant_id, created_at DESC);
