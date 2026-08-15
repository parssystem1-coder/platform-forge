# Backlog اجرایی فاز ۱

## Slice A: Boot and Database

- [ ] ایجاد workspace و package boundaries
- [ ] اجرای core migration
- [ ] ساخت roleهای `platform_owner` و `platform_app`
- [ ] فعال‌سازی FORCE RLS
- [ ] ساخت migration test
- [ ] ساخت Tenant Leak Suite پایه

## Slice B: Kernel

- [ ] Env schema
- [ ] RequestContext با AsyncLocalStorage
- [ ] Correlation ID middleware
- [ ] Problem Details filter
- [ ] UnitOfWork و `withTenant`
- [ ] Health/Readiness/Metrics
- [ ] Structured logging

## Slice C: Registration

- [ ] User aggregate
- [ ] Credential port + Argon2 adapter
- [ ] Tenant aggregate
- [ ] Membership aggregate
- [ ] RegisterUser use case
- [ ] Email token port
- [ ] Mailpit adapter
- [ ] Register endpoint
- [ ] Verify endpoint
- [ ] e2e register/verify

## Slice D: Sessions

- [ ] Session aggregate
- [ ] Refresh token family
- [ ] JWT signer port
- [ ] Login use case
- [ ] Refresh rotation
- [ ] Reuse detection
- [ ] Logout current
- [ ] Logout all
- [ ] Session list/revoke
- [ ] e2e session suite

## Slice E: Authorization

- [ ] Permission registry
- [ ] Role registry
- [ ] `authorize()` service
- [ ] Tenant resolver
- [ ] `GET /me`
- [ ] `GET /tenants`
- [ ] `POST /tenants/switch`
- [ ] role matrix tests
- [ ] cross-tenant denial tests

## Slice F: Recovery and Security

- [ ] Password reset request
- [ ] Password reset completion
- [ ] TOTP setup
- [ ] TOTP verify
- [ ] Recovery codes
- [ ] Login challenge state
- [ ] Public endpoint rate limits
- [ ] security e2e tests

## Slice G: Gate

- [ ] Outbox events for major writes
- [ ] Audit events
- [ ] OpenAPI contract check
- [ ] Architecture boundary check
- [ ] Full `pnpm verify`
- [ ] Demo script recorded
