# API Contract فاز ۶

## Platform Admin

```text
POST   /platform/v1/plans
POST   /platform/v1/plans/:id/versions
PATCH  /platform/v1/plan-versions/:id
POST   /platform/v1/plan-versions/:id/publish
POST   /platform/v1/plan-versions/:id/retire
GET    /platform/v1/features
GET    /platform/v1/quotas
```

## Tenant Admin

```text
GET    /api/v1/billing/plan
GET    /api/v1/billing/features
GET    /api/v1/billing/features/explain
POST   /api/v1/billing/features/overrides   # فقط در صورت permission enterprise/support
```

## Explain response

```json
{
  "tenantId": "uuid",
  "planVersion": { "planKey": "professional", "version": 2 },
  "features": {
    "commerce.catalog": { "enabled": true, "source": "plan" },
    "platform.white_label": { "enabled": false, "source": "plan" }
  },
  "quotas": {
    "commerce.products": { "limit": 5000, "source": "plan" }
  }
}
```
