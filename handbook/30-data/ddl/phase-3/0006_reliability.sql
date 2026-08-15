-- Phase 3 reliability and notification tables.

CREATE TABLE outbox_dead_letters (
  id uuid PRIMARY KEY,
  original_event_id uuid NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  tenant_id uuid NULL REFERENCES tenants(id),
  event_type text NOT NULL,
  event_version integer NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL,
  attempts integer NOT NULL,
  last_error text NOT NULL,
  dead_lettered_at timestamptz NOT NULL,
  correlation_id uuid NOT NULL,
  replayed_at timestamptz NULL,
  replayed_by uuid NULL REFERENCES users(id)
);

CREATE TABLE processed_events (
  consumer_name text NOT NULL,
  event_id uuid NOT NULL,
  processed_at timestamptz NOT NULL,
  result jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (consumer_name, event_id)
);

CREATE TABLE notification_templates (
  id uuid PRIMARY KEY,
  template_key text NOT NULL,
  version integer NOT NULL,
  locale text NOT NULL,
  subject_template text NOT NULL,
  body_template text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'retired')),
  created_at timestamptz NOT NULL,
  UNIQUE (template_key, version, locale)
);

CREATE TABLE notification_preferences (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_key text NOT NULL,
  enabled boolean NOT NULL,
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, user_id, notification_key)
);

CREATE TABLE notification_deliveries (
  id uuid PRIMARY KEY,
  tenant_id uuid NULL REFERENCES tenants(id),
  recipient_user_id uuid NULL REFERENCES users(id),
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app', 'webhook')),
  notification_key text NOT NULL,
  template_key text NOT NULL,
  template_version integer NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'sending', 'sent', 'retry_scheduled', 'failed', 'dead_letter')),
  provider_message_id text NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text NULL,
  correlation_id uuid NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  queued_at timestamptz NOT NULL,
  sent_at timestamptz NULL
);

CREATE INDEX notification_delivery_pending_idx
  ON notification_deliveries(status, queued_at)
  WHERE status IN ('queued', 'retry_scheduled');

CREATE INDEX dead_letters_pending_idx
  ON outbox_dead_letters(dead_lettered_at)
  WHERE replayed_at IS NULL;

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences FORCE ROW LEVEL SECURITY;
CREATE POLICY notification_preferences_tenant_rls ON notification_preferences
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries FORCE ROW LEVEL SECURITY;
CREATE POLICY notification_deliveries_tenant_rls ON notification_deliveries
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);
