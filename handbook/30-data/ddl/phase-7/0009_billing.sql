CREATE TABLE subscriptions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_version_id uuid NOT NULL REFERENCES plan_versions(id),
  status text NOT NULL CHECK (status IN ('trialing','active','past_due','paused','canceled','expired')),
  billing_period text NOT NULL,
  currency text NOT NULL,
  recurring_price_minor bigint NOT NULL CHECK (recurring_price_minor >= 0),
  trial_ends_at timestamptz NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE subscription_history (
  id uuid PRIMARY KEY,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  from_plan_version_id uuid NULL REFERENCES plan_versions(id),
  to_plan_version_id uuid NOT NULL REFERENCES plan_versions(id),
  reason text NOT NULL,
  effective_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  subscription_id uuid NULL REFERENCES subscriptions(id),
  invoice_number text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','open','paid','void','uncollectible')),
  currency text NOT NULL,
  subtotal_minor bigint NOT NULL CHECK (subtotal_minor >= 0),
  discount_minor bigint NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  tax_minor bigint NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  total_minor bigint NOT NULL CHECK (total_minor >= 0),
  due_at timestamptz NULL,
  finalized_at timestamptz NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE invoice_lines (
  id uuid PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  description text NOT NULL,
  quantity bigint NOT NULL CHECK (quantity > 0),
  unit_price_minor bigint NOT NULL CHECK (unit_price_minor >= 0),
  total_minor bigint NOT NULL CHECK (total_minor >= 0),
  period_start timestamptz NULL,
  period_end timestamptz NULL
);

CREATE TABLE payments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  invoice_id uuid NULL REFERENCES invoices(id),
  provider text NOT NULL,
  provider_reference text NULL,
  status text NOT NULL CHECK (status IN ('created','pending','succeeded','failed','refunded')),
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  currency text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  failure_code text NULL,
  succeeded_at timestamptz NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE payment_webhook_events (
  id uuid PRIMARY KEY,
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  signature_valid boolean NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('received','verified','processed','failed','ignored')),
  received_at timestamptz NOT NULL,
  processed_at timestamptz NULL,
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE ledger_accounts (
  id uuid PRIMARY KEY,
  tenant_id uuid NULL REFERENCES tenants(id),
  code text NOT NULL,
  name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  currency text NOT NULL,
  UNIQUE (tenant_id, code, currency)
);

CREATE TABLE ledger_entries (
  id uuid PRIMARY KEY,
  tenant_id uuid NULL REFERENCES tenants(id),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  description text NOT NULL,
  currency text NOT NULL,
  correlation_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (source_type, source_id)
);

CREATE TABLE ledger_lines (
  id uuid PRIMARY KEY,
  entry_id uuid NOT NULL REFERENCES ledger_entries(id) ON DELETE RESTRICT,
  account_id uuid NOT NULL REFERENCES ledger_accounts(id),
  direction text NOT NULL CHECK (direction IN ('debit','credit')),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL
);

CREATE TABLE reconciliation_runs (
  id uuid PRIMARY KEY,
  provider text NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('running','completed','failed')),
  matched_count integer NOT NULL DEFAULT 0,
  mismatch_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL,
  completed_at timestamptz NULL
);

CREATE INDEX subscriptions_tenant_status_idx ON subscriptions(tenant_id, status);
CREATE INDEX payments_provider_reference_idx ON payments(provider, provider_reference);
CREATE INDEX webhook_pending_idx ON payment_webhook_events(status, received_at) WHERE status IN ('received','verified');
CREATE INDEX ledger_entries_tenant_time_idx ON ledger_entries(tenant_id, occurred_at);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['subscriptions','subscription_history','invoices','invoice_lines','payments','ledger_entries'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid)', t || '_tenant_policy', t);
  END LOOP;
END $$;

