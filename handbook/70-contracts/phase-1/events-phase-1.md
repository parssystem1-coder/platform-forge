# Event Contract فاز ۱

## Events

```text
identity.user_registered
identity.email_verified
identity.login_succeeded
identity.login_failed
identity.session_created
identity.session_revoked
identity.session_compromised
tenancy.tenant_created
tenancy.membership_created
tenancy.tenant_switched
authz.authorization_denied
```

## Envelope

```json
{
  "id": "uuid",
  "eventType": "identity.user_registered",
  "eventVersion": 1,
  "aggregateType": "user",
  "aggregateId": "uuid",
  "tenantId": "uuid|null",
  "actorUserId": "uuid|null",
  "occurredAt": "ISO-8601",
  "correlationId": "uuid",
  "causationId": "uuid|null",
  "payload": {}
}
```

تمام eventها at-least-once هستند و consumer باید idempotent باشد.
