# Event Catalog

## v1 events in Step 1
- `identity.user_registered`
- `identity.email_verified`
- `identity.login_succeeded`
- `identity.login_failed`
- `identity.password_reset_requested`
- `identity.password_reset_completed`
- `identity.mfa_enabled`
- `identity.session_revoked`
- `tenancy.tenant_created`
- `tenancy.membership_created`

## Envelope
```json
{
  "id": "uuid",
  "eventType": "identity.user_registered",
  "eventVersion": 1,
  "aggregateType": "user",
  "aggregateId": "uuid",
  "tenantId": null,
  "occurredAt": "2026-08-15T00:00:00Z",
  "correlationId": "uuid",
  "causationId": null,
  "payload": {}
}
```
