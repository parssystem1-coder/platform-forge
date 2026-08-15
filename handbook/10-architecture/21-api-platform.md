# 08. API Contract

مرجع machine-readable در `contracts/openapi.yaml` است. این سند خلاصه‌ی تصمیم‌ها را می‌دهد.

## 8.1 اصول API

- REST JSON
- Versioned under `/api/v1`
- Errors: `application/problem+json`
- Auth:
  - access token: `Authorization: Bearer <jwt>`
  - refresh token: HttpOnly cookie
- Tenant context:
  - `X-Tenant-Id` برای endpointهای tenant-bound

---

## 8.2 Endpoint set گام اول

### Public
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/request-password-reset`
- `POST /api/v1/auth/reset-password`

### Authenticated
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/me`
- `GET /api/v1/me/sessions`
- `DELETE /api/v1/me/sessions/:sessionId`
- `POST /api/v1/me/mfa/totp/setup`
- `POST /api/v1/me/mfa/totp/verify`
- `POST /api/v1/me/mfa/recovery-codes/regenerate`
- `GET /api/v1/tenants`
- `POST /api/v1/tenants/switch`

### Platform operational
- `GET /healthz`
- `GET /readyz`
- `GET /metrics`

---

## 8.3 Register

### Request

```json
{
  "email": "owner@example.com",
  "password": "StrongPassword123!",
  "displayName": "Owner Name",
  "tenantName": "My Shop",
  "tenantSlug": "myshop",
  "locale": "en-US",
  "timezone": "Asia/Tehran"
}
```

### Behavior

در یک تراکنش:
- user ساخته می‌شود
- credential ساخته می‌شود
- tenant ساخته می‌شود
- membership owner ساخته می‌شود
- verification token ساخته می‌شود
- audit و outbox ثبت می‌شود

### Response
`201 Created`

```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "emailVerificationRequired": true
}
```

### Failure examples
- duplicate email
- duplicate tenant slug
- weak password
- invalid timezone

---

## 8.4 Verify email

Token opaque از ایمیل می‌آید، سرور hash می‌کند و row را پیدا می‌کند.
توکن single-use است.

`204 No Content`

---

## 8.5 Login

### Request

```json
{
  "email": "owner@example.com",
  "password": "StrongPassword123!",
  "totpCode": "123456"
}
```

### Login outcomes

1. invalid credentials
2. email not verified
3. account locked temporarily
4. mfa required
5. success

### Success response

- access token in body
- refresh token in HttpOnly cookie

```json
{
  "accessToken": "jwt",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "displayName": "Owner Name"
  }
}
```

---

## 8.6 Refresh

`POST /auth/refresh` با cookie.

Success:
- access token جدید
- refresh token rotated

اگر reuse detected شد:
- `401`
- session compromised
- cookie پاک می‌شود

---

## 8.7 Me

`GET /me`

```json
{
  "id": "uuid",
  "email": "owner@example.com",
  "displayName": "Owner Name",
  "emailVerified": true,
  "memberships": [
    {
      "tenantId": "uuid",
      "tenantName": "My Shop",
      "role": "owner",
      "status": "active"
    }
  ]
}
```

---

## 8.8 Tenant list and switch

### `GET /tenants`
برمی‌گرداند عضویت‌های فعال کاربر.

### `POST /tenants/switch`

```json
{
  "tenantId": "uuid"
}
```

Behavior:
- membership validate
- tenant active check
- access token جدید با claim مربوطه یا response context برگردد

### تصمیم پیشنهادی

Access token tenant-agnostic بماند و tenant فعال از header بیاید.
Switch endpoint فقط preference لایه‌ی client را ساده می‌کند.
این کار coupling توکن به tenant را کم می‌کند.

---

## 8.9 MFA setup

### Setup
- secret تولید می‌شود
- otpauth URI برمی‌گردد
- QR generation client-side یا server-side optional
- factor تا verify نهایی active نیست

### Verify
- user کد TOTP را می‌فرستد
- اگر درست بود factor verified می‌شود
- recovery codes جدید تولید می‌شوند

---

## 8.10 Problem Details shape

```json
{
  "type": "https://docs.yourplatform.dev/problems/identity.invalid-credentials",
  "title": "Invalid credentials",
  "status": 401,
  "detail": "The email or password is incorrect.",
  "code": "identity.invalid_credentials",
  "instance": "/api/v1/auth/login",
  "correlationId": "uuid"
}
```

جزئیات بیشتر در `contracts/errors.md`.
