# Error Catalog (v2 - AMENDMENT v3)

> Closes finding F-020. The v1 catalog listed 24 codes while the code and
> twelve other documents referenced codes that were never in it, including
> `billing.feature_not_available`, `billing.quota_exceeded` and the whole
> `commerce.*` family. Rule 13 of the AGENT_BRIEF ("a machine-readable code
> from errors.md") was therefore broken from day one.
>
> This file is the single source of truth. `pnpm contract:drift` fails CI if
> any thrown code is missing here, or any code here is never thrown.

## Envelope

Every error is `application/problem+json` per RFC 9457:

```json
{
  "type": "https://errors.platform.example/billing.quota_exceeded",
  "title": "Quota exceeded",
  "status": 429,
  "code": "billing.quota_exceeded",
  "detail": "Monthly product limit reached for this plan.",
  "instance": "/api/v1/products",
  "correlationId": "7c3f...",
  "meta": { "quotaKey": "commerce.products", "limit": 500 }
}
```

`code` is the contract. `title` and `detail` are human text and may change.

## Status code semantics, non negotiable

| Status | Means | Frontend behaviour |
| --- | --- | --- |
| 401 | not authenticated, or session invalid | send to login |
| 402 | authenticated and permitted, but the plan does not include it | UpgradeCard |
| 403 | authenticated, but not permitted or not the owner | hide the action |
| 409 | state conflict | explain, offer retry |
| 422 | input validation | inline field errors |
| 423 | locked | cool-down message |
| 429 | rate limit OR quota exhausted | distinguish by `code` |

> The 402 / 403 distinction is revenue, not pedantry. 403 hides the button.
> 402 sells the upgrade.

## Identity

- `identity.email_already_used` -> 409
- `identity.tenant_slug_already_used` -> 409
- `identity.invalid_credentials` -> 401
- `identity.email_not_verified` -> 403
- `identity.account_locked` -> 423
- `identity.invalid_verification_token` -> 400
- `identity.expired_verification_token` -> 400
- `identity.invalid_reset_token` -> 400
- `identity.expired_reset_token` -> 400
- `identity.mfa_required` -> 401
- `identity.invalid_totp` -> 401
- `identity.invalid_recovery_code` -> 401
- `identity.session_compromised` -> 401
- `identity.refresh_token_reused` -> 401  *(added: reuse detection had no code)*
- `identity.session_expired` -> 401  *(added)*

## Tenancy

- `tenancy.membership_not_found` -> 403
- `tenancy.tenant_not_active` -> 403
- `tenancy.invalid_tenant_context` -> 400
- `tenancy.last_owner_cannot_leave` -> 409  *(added: owner lifecycle had no code)*
- `tenancy.invitation_expired` -> 400  *(added)*
- `tenancy.provisioning_failed` -> 500  *(added)*

## Authz

- `authz.forbidden` -> 403
- `authz.not_resource_owner` -> 403  *(added: the customer realm had no code, F-029)*
- `authz.scope_missing` -> 403  *(added: machine clients had no code, F-015)*
- `authz.staff_action_requires_reason` -> 422  *(added: staff access is audited, F-030)*

## Billing, features and quota

- `billing.feature_not_available` -> 402  *(referenced by authorization.ts, was missing)*
- `billing.quota_exceeded` -> 429  *(referenced by quota-service.ts, was missing)*
- `billing.quota_not_configured` -> 409
- `billing.payment_required` -> 402
- `billing.subscription_not_active` -> 402
- `billing.plan_version_retired` -> 409
- `billing.downgrade_blocked_by_usage` -> 409
- `billing.invoice_already_paid` -> 409
- `billing.refund_exceeds_payment` -> 422
- `billing.ledger_entry_unbalanced` -> 500  *(F-031: now enforced by the DB)*
- `billing.webhook_signature_invalid` -> 400
- `billing.webhook_replayed` -> 200  *(idempotent: acknowledged, not an error)*

## Commerce

- `commerce.product_not_found` -> 404
- `commerce.variant_not_found` -> 404
- `commerce.product_slug_already_used` -> 409
- `commerce.sku_already_used` -> 409
- `commerce.cart_not_found` -> 404
- `commerce.cart_empty` -> 422
- `commerce.cart_locked_during_checkout` -> 409
- `commerce.insufficient_inventory` -> 409
- `commerce.reservation_expired` -> 409
- `commerce.price_changed_during_checkout` -> 409
- `commerce.order_not_found` -> 404
- `commerce.order_not_cancellable` -> 409
- `commerce.payment_failed` -> 402
- `commerce.currency_mismatch` -> 422

## Storefront and domains

- `storefront.domain_not_mapped` -> 404
- `storefront.domain_verification_pending` -> 409
- `storefront.read_model_stale` -> 503

## Notifications

- `notifications.template_not_found` -> 500
- `notifications.provider_unavailable` -> 503
- `notifications.recipient_opted_out` -> 409

## Platform API and extensibility

- `api.version_unsupported` -> 400
- `api.key_revoked` -> 401
- `api.idempotency_key_reused_with_different_body` -> 422
- `ai.budget_exhausted` -> 429
- `ai.provider_unavailable` -> 503

## Common

- `common.validation_failed` -> 422
- `common.rate_limited` -> 429
- `common.not_found` -> 404
- `common.conflict` -> 409
- `common.internal_error` -> 500
- `common.service_unavailable` -> 503

## Rules

1. A new code without a test that produces it is not done.
2. Never reuse a code with a different status.
3. Never leak a provider message into `detail`. Map it.
4. `meta` may carry machine-usable context, never secrets.
