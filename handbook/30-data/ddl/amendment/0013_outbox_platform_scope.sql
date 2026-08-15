DROP POLICY IF EXISTS outbox_events_app_policy ON outbox_events;
DROP POLICY IF EXISTS outbox_events_platform_insert ON outbox_events;
DROP POLICY IF EXISTS outbox_events_app_read ON outbox_events;
DROP POLICY IF EXISTS outbox_events_app_insert ON outbox_events;

CREATE POLICY outbox_events_app_read ON outbox_events
  FOR SELECT TO platform_app
  USING (tenant_id = app_current_tenant());

CREATE POLICY outbox_events_app_insert ON outbox_events
  FOR INSERT TO platform_app
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY outbox_events_platform_insert ON outbox_events
  FOR INSERT TO platform_app
  WITH CHECK (tenant_id IS NULL AND app_current_tenant() IS NULL);

REVOKE UPDATE, DELETE ON outbox_events FROM platform_app;