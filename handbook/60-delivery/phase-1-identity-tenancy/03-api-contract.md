# Phase 1 API Contract

## Authentication Endpoints

### POST /api/v1/auth/register

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!",
  "displayName": "John Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": false,
    "status": "active",
    "createdAt": "2026-08-15T00:00:00Z"
  },
  "session": {
    "accessToken": "eyJ...",
    "refreshToken": "uuid",
    "expiresIn": 900
  },
  "emailVerificationRequired": true
}
```

**Errors:**
- `409 identity.email_already_used` - Email already registered
- `422 common.validation_failed` - Invalid input

---

### POST /api/v1/auth/login

Authenticate with credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true,
    "mfaEnabled": false
  },
  "session": {
    "accessToken": "eyJ...",
    "refreshToken": "uuid",
    "expiresIn": 900
  }
}
```

**Errors:**
- `401 identity.invalid_credentials` - Wrong email or password
- `401 identity.account_locked` - Account temporarily locked
- `401 identity.mfa_required` - MFA verification required (includes `mfaToken`)
- `403 identity.email_not_verified` - Email not verified

---

### POST /api/v1/auth/logout

End the current session.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (204):** No content

---

### POST /api/v1/auth/refresh

Refresh access token.

**Request:**
```json
{
  "refreshToken": "uuid"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "uuid",
  "expiresIn": 900
}
```

**Errors:**
- `401 identity.session_expired` - Refresh token expired or revoked
- `401 identity.refresh_token_reused` - Token reuse detected (security event)

---

### POST /api/v1/auth/verify-email

Verify email address.

**Request:**
```json
{
  "token": "verification-token"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "emailVerified": true
  }
}
```

**Errors:**
- `400 identity.invalid_verification_token`
- `400 identity.expired_verification_token`

---

### POST /api/v1/auth/request-password-reset

Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a reset link has been sent"
}
```

*Always returns 200 to prevent email enumeration.*

---

### POST /api/v1/auth/reset-password

Reset password using token.

**Request:**
```json
{
  "token": "reset-token",
  "newPassword": "NewSecureP@ssw0rd!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

**Errors:**
- `400 identity.invalid_reset_token`
- `400 identity.expired_reset_token`
- `422 common.validation_failed` - Password too weak

---

### POST /api/v1/auth/mfa/enable

Enable MFA for the account.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "password": "CurrentPassword"
}
```

**Response (200):**
```json
{
  "secret": "BASE32SECRET",
  "qrCodeUrl": "otpauth://totp/Platform:user@example.com?secret=...",
  "recoveryCodes": ["xxxx-xxxx", "xxxx-xxxx", ...]
}
```

**Errors:**
- `401 identity.invalid_credentials` - Wrong password
- `409 identity.mfa_already_enabled` - MFA already enabled

---

### POST /api/v1/auth/mfa/verify

Verify MFA code during login.

**Request:**
```json
{
  "mfaToken": "from-login-response",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "user": { ... },
  "session": { ... }
}
```

**Errors:**
- `401 identity.invalid_totp`
- `401 identity.invalid_recovery_code`

---

### GET /api/v1/auth/me

Get current user info.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "John Doe",
  "emailVerified": true,
  "mfaEnabled": true,
  "createdAt": "2026-01-01T00:00:00Z",
  "lastLoginAt": "2026-08-15T00:00:00Z"
}
```

---

## Tenancy Endpoints

### POST /api/v1/tenants

Create a new tenant.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "name": "My Store",
  "slug": "my-store"
}
```

**Response (201):**
```json
{
  "tenant": {
    "id": "uuid",
    "name": "My Store",
    "slug": "my-store",
    "status": "active",
    "plan": {
      "id": "uuid",
      "name": "Starter"
    },
    "createdAt": "2026-08-15T00:00:00Z"
  },
  "membership": {
    "id": "uuid",
    "role": "owner"
  }
}
```

**Errors:**
- `409 identity.tenant_slug_already_used`
- `402 billing.feature_not_available` - If creating tenants is a paid feature

---

### GET /api/v1/tenants

List user's tenants.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "tenants": [
    {
      "id": "uuid",
      "name": "My Store",
      "slug": "my-store",
      "role": "owner",
      "status": "active"
    }
  ]
}
```

---

### GET /api/v1/tenants/:id

Get tenant details.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "My Store",
  "slug": "my-store",
  "status": "active",
  "settings": {},
  "members": [
    {
      "userId": "uuid",
      "email": "user@example.com",
      "role": "owner",
      "status": "active",
      "joinedAt": "2026-08-15T00:00:00Z"
    }
  ],
  "createdAt": "2026-08-15T00:00:00Z"
}
```

**Errors:**
- `404 tenancy.tenant_not_found`
- `403 tenancy.membership_not_found`

---

### PATCH /api/v1/tenants/:id

Update tenant.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "name": "New Store Name"
}
```

**Response (200):** Updated tenant object

**Errors:**
- `403 authz.forbidden` - Requires owner role

---

### POST /api/v1/tenants/:id/switch

Switch active tenant context.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "tenantId": "uuid",
  "role": "owner",
  "accessToken": "eyJ..."
}
```

**Errors:**
- `403 tenancy.membership_not_found`

---

### POST /api/v1/tenants/:id/members

Invite a member.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "email": "newmember@example.com",
  "role": "admin"
}
```

**Response (201):**
```json
{
  "membership": {
    "id": "uuid",
    "userId": "uuid",
    "email": "newmember@example.com",
    "role": "admin",
    "status": "invited"
  }
}
```

**Errors:**
- `409 tenancy.membership_exists`
- `403 authz.forbidden` - Requires owner/admin role

---

### DELETE /api/v1/tenants/:id/members/:userId

Remove a member.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (204):** No content

**Errors:**
- `409 tenancy.last_owner_cannot_leave`
- `403 authz.forbidden`

---

### PATCH /api/v1/tenants/:id/members/:userId

Update member role.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "role": "member"
}
```

**Response (200):** Updated membership

**Errors:**
- `409 tenancy.cannot_change_own_role`
- `403 authz.forbidden`

---

## Authorization Endpoints

### GET /api/v1/permissions

List available permissions.

**Response (200):**
```json
{
  "permissions": [
    { "key": "tenant.manage", "description": "Manage tenant settings" },
    { "key": "member.invite", "description": "Invite new members" },
    ...
  ]
}
```

---

### GET /api/v1/roles

List available roles.

**Response (200):**
```json
{
  "roles": [
    {
      "key": "owner",
      "name": "Owner",
      "permissions": ["tenant.*", "member.*", "billing.view"]
    },
    {
      "key": "admin", 
      "name": "Administrator",
      "permissions": ["member.*", "content.*"]
    }
  ]
}
```
