# جریان‌های کاربری فاز ۱

## Register

```text
POST /auth/register
 -> validate input
 -> normalize email/slug
 -> hash password
 -> create user pending_verification
 -> create tenant
 -> create owner membership
 -> create verification token hash
 -> append audit + outbox
 -> commit
 -> worker sends email
```

## Verify Email

```text
opaque token
 -> hash token
 -> find unconsumed non-expired token
 -> mark consumed
 -> activate user
 -> append audit + outbox
```

## Login

```text
email/password
 -> rate limit
 -> load credential
 -> verify Argon2id
 -> reject unverified user
 -> if MFA enabled: issue pending challenge
 -> else: create session + refresh token
 -> issue access token
```

## Refresh

```text
refresh cookie
 -> hash opaque token
 -> load token and session
 -> reject expired/revoked token
 -> if consumed: mark family compromised and revoke all
 -> mark old token consumed
 -> issue replacement token
 -> issue new access token
```

## Tenant Switch

```text
POST /tenants/switch
 -> authenticate user
 -> validate target tenant
 -> find active membership
 -> validate tenant active
 -> return tenant context acknowledgement
```

توکن tenant-agnostic می‌ماند؛ هر request tenant-bound دوباره Membership و context را اعتبارسنجی می‌کند.
