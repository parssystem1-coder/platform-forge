-- Phase 1 hardening: constraints and indexes.
-- Apply after 0001_core.sql. This migration intentionally contains no destructive change.

CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);
CREATE INDEX IF NOT EXISTS email_verification_tokens_user_idx ON email_verification_tokens(user_id, expires_at);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens(user_id, expires_at);
CREATE INDEX IF NOT EXISTS sessions_active_user_idx ON sessions(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx ON session_refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS memberships_active_user_idx ON memberships(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS memberships_active_tenant_idx ON memberships(tenant_id, status) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS one_owner_per_tenant_guard_idx ON memberships(tenant_id, role) WHERE role = 'owner' AND status = 'active';
