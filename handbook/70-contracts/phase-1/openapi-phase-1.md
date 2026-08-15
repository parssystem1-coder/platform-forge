# API Contract فاز ۱

## Public

```text
POST /api/v1/auth/register
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/request-password-reset
POST /api/v1/auth/reset-password
```

## Authenticated

```text
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
GET    /api/v1/me
GET    /api/v1/me/sessions
DELETE /api/v1/me/sessions/:sessionId
GET    /api/v1/tenants
POST   /api/v1/tenants/switch
POST   /api/v1/me/mfa/totp/setup
POST   /api/v1/me/mfa/totp/verify
POST   /api/v1/me/mfa/recovery-codes/regenerate
```

## Register response

```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "emailVerificationRequired": true
}
```

## Login response

```json
{
  "accessToken": "jwt",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "displayName": "Owner"
  }
}
```

Refresh token فقط در HttpOnly cookie برمی‌گردد و در body قرار نمی‌گیرد.

## Problem Details

```json
{
  "type": "https://docs.example.com/problems/identity.invalid-credentials",
  "title": "Invalid credentials",
  "status": 401,
  "code": "identity.invalid_credentials",
  "correlationId": "uuid"
}
```
