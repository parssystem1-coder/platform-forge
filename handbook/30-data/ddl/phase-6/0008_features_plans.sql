CREATE TABLE feature_definitions (
  key text PRIMARY KEY,
  description text NOT NULL,
  value_type text NOT NULL CHECK (value_type IN ('boolean','integer','number','string','json')),
  status text NOT NULL CHECK (status IN ('active','retired')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE quota_definitions (
  key text PRIMARY KEY,
  description text NOT NULL,
  unit text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('gauge','counter')),
  status text NOT NULL CHECK (status IN ('active','retired')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE plans (
  id uuid PRIMARY KEY,
  key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','active','retired')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE plan_versions (
  id uuid PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES plans(id),
  version integer NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','published','retired')),
  currency text NOT NULL,
  price_minor bigint NOT NULL CHECK (price_minor >= 0),
  billing_period text NOT NULL CHECK (billing_period IN ('month','year','custom')),
  published_at timestamptz NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (plan_id, version)
);

CREATE TABLE plan_features (
  plan_version_id uuid NOT NULL REFERENCES plan_versions(id) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES feature_definitions(key),
  enabled boolean NOT NULL,
  value jsonb NULL,
  PRIMARY KEY (plan_version_id, feature_key)
);

CREATE TABLE plan_quotas (
  plan_version_id uuid NOT NULL REFERENCES plan_versions(id) ON DELETE CASCADE,
  quota_key text NOT NULL REFERENCES quota_definitions(key),
  limit_value bigint NOT NULL CHECK (limit_value >= 0),
  PRIMARY KEY (plan_version_id, quota_key)
);

CREATE TABLE tenant_plan_assignments (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  plan_version_id uuid NOT NULL REFERENCES plan_versions(id),
  status text NOT NULL CHECK (status IN ('trialing','active','past_due','paused','canceled','expired')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NULL,
  assigned_by uuid NULL REFERENCES users(id),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE tenant_feature_overrides (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES feature_definitions(key),
  enabled boolean NOT NULL,
  value jsonb NULL,
  reason text NOT NULL,
  expires_at timestamptz NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL
);

CREATE INDEX plan_versions_published_idx ON plan_versions(plan_id, status);
CREATE INDEX tenant_overrides_active_idx ON tenant_feature_overrides(tenant_id, feature_key) WHERE expires_at IS NULL;

ALTER TABLE tenant_plan_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_plan_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_plan_assignments_rls ON tenant_plan_assignments
USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE tenant_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_overrides FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_feature_overrides_rls ON tenant_feature_overrides
USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
