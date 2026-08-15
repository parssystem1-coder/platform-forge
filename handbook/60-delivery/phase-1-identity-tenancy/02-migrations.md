# Phase 1 Migration Plan

## Database Schema for Identity + Tenancy

These tables are already defined in `0001_core.sql` and `amendment/00*.sql`.

## Tables to Create

### Identity Tables (Phase 1)

```sql
-- Users table (already in 0001_core.sql)
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext NOT NULL UNIQUE,
  email_verified  boolean NOT NULL DEFAULT false,
  display_name    text,
  avatar_url      text,
  status          text NOT NULL DEFAULT 'active' 
                  CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  last_login_at   timestamptz
);

-- User credentials (password)
CREATE TABLE user_credentials (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash       text NOT NULL,
  password_version     integer NOT NULL DEFAULT 1,
  password_changed_at  timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Sessions
CREATE TABLE sessions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_refresh_token_id uuid REFERENCES session_refresh_tokens(id),
  user_agent              text,
  ip_address              inet,
  last_active_at          timestamptz NOT NULL DEFAULT now(),
  expires_at              timestamptz NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- Session refresh tokens
CREATE TABLE session_refresh_tokens (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  family_id           uuid NOT NULL,
  parent_token_id     uuid REFERENCES session_refresh_tokens(id),
  replaced_by_token_id uuid REFERENCES session_refresh_tokens(id),
  token_hash          text NOT NULL,
  expires_at          timestamptz NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- MFA TOTP factors
CREATE TABLE mfa_totp_factors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret_ciphertext   text NOT NULL,
  secret_key_version   integer NOT NULL DEFAULT 1,
  confirmed           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- MFA recovery codes
CREATE TABLE mfa_recovery_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   text NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

### Tenancy Tables

```sql
-- Tenants (already in 0001_core.sql)
CREATE TABLE tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        citext NOT NULL UNIQUE,
  name        text NOT NULL,
  plan_id     uuid REFERENCES plan_versions(id),
  status      text NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'suspended', 'deleted', 'provisioning')),
  settings    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Memberships (already in 0001_core.sql)
CREATE TABLE memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        text NOT NULL,
  status      text NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'invited', 'suspended')),
  invited_at  timestamptz NOT NULL DEFAULT now(),
  joined_at   timestamptz,
  UNIQUE (tenant_id, user_id)
);
```

## RLS Policies

### Users (Platform-wide)

```sql
-- Users are platform-wide, not tenant-bound
-- No RLS needed for users table
```

### Sessions

```sql
-- Sessions belong to users, platform-wide
CREATE POLICY sessions_user_read ON sessions
  FOR SELECT TO platform_app
  USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid);

CREATE POLICY sessions_user_write ON sessions
  FOR ALL TO platform_app
  USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);
```

### Tenants

See `amendment/0010_rls_hardening.sql` Section 4 for the three-policy approach.

### Memberships

See `amendment/0010_rls_hardening.sql` Section 4 for the two-policy approach.

## Migration Order

1. `0001_core.sql` - Create tables
2. `phase-1/0004_identity_constraints.sql` - Add constraints
3. `amendment/0010_rls_hardening.sql` - Apply RLS policies

## Seed Data

### Default Roles

```sql
INSERT INTO roles (name, permissions) VALUES
  ('owner', ARRAY['tenant.*', 'member.*', 'billing.view']),
  ('admin', ARRAY['member.*', 'content.*']),
  ('member', ARRAY['content.read', 'content.write']);
```

### Default Plan

```sql
INSERT INTO plan_versions (name, slug, monthly_price_minor, currency)
VALUES ('Starter', 'starter', 0, 'USD');
```
