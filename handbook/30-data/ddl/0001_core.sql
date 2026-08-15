CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY,
  email citext NOT NULL UNIQUE,
  email_verified_at timestamptz NULL,
  phone text NULL,
  phone_verified_at timestamptz NULL,
  display_name text NOT NULL,
  avatar_url text NULL,
  locale text NOT NULL DEFAULT 'en-US',
  timezone text NOT NULL DEFAULT 'UTC',
  status text NOT NULL CHECK (status IN ('pending_verification', 'active', 'suspended')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE user_credentials (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  password_changed_at timestamptz NOT NULL,
  failed_login_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE email_verification_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE mfa_totp_factors (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret_ciphertext bytea NOT NULL,
  secret_key_version text NOT NULL,
  label text NOT NULL,
  verified_at timestamptz NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE mfa_recovery_codes (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  consumed_at timestamptz NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  slug citext NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('active', 'suspended', 'archived')),
  locale text NOT NULL,
  timezone text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE memberships (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status text NOT NULL CHECK (status IN ('active', 'invited', 'suspended')),
  joined_at timestamptz NOT NULL,
  invited_by_user_id uuid NULL REFERENCES users(id),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT memberships_tenant_user_unique UNIQUE (tenant_id, user_id)
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('active', 'revoked', 'expired', 'compromised')),
  created_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  revoke_reason text NULL,
  ip_address inet NULL,
  user_agent text NULL,
  device_name text NULL,
  current_refresh_token_id uuid NULL
);

CREATE TABLE session_refresh_tokens (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  family_id uuid NOT NULL,
  parent_token_id uuid NULL REFERENCES session_refresh_tokens(id),
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  revoked_at timestamptz NULL,
  replaced_by_token_id uuid NULL REFERENCES session_refresh_tokens(id)
);

ALTER TABLE sessions
  ADD CONSTRAINT sessions_current_refresh_token_fk
  FOREIGN KEY (current_refresh_token_id)
  REFERENCES session_refresh_tokens(id);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL,
  actor_user_id uuid NULL REFERENCES users(id),
  tenant_id uuid NULL REFERENCES tenants(id),
  session_id uuid NULL REFERENCES sessions(id),
  action text NOT NULL,
  target_type text NULL,
  target_id uuid NULL,
  ip_address inet NULL,
  correlation_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE outbox_events (
  id uuid PRIMARY KEY,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  tenant_id uuid NULL REFERENCES tenants(id),
  event_type text NOT NULL,
  event_version integer NOT NULL DEFAULT 1,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL,
  available_at timestamptz NOT NULL,
  published_at timestamptz NULL,
  attempts integer NOT NULL DEFAULT 0,
  last_error text NULL,
  correlation_id uuid NOT NULL,
  causation_id uuid NULL
);

CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_refresh_tokens_session_id ON session_refresh_tokens(session_id);
CREATE INDEX idx_outbox_pending ON outbox_events(available_at) WHERE published_at IS NULL;
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, occurred_at DESC);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenants_rls_policy ON tenants
  USING (id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY memberships_rls_policy ON memberships
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_rls_policy ON audit_logs
  USING (
    tenant_id IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );
