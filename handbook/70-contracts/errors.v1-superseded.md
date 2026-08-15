# Error Catalog

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

## Tenancy
- `tenancy.membership_not_found` -> 403
- `tenancy.tenant_not_active` -> 403
- `tenancy.invalid_tenant_context` -> 400

## Authz
- `authz.forbidden` -> 403

## Common
- `common.validation_failed` -> 422
- `common.rate_limited` -> 429
- `common.internal_error` -> 500
