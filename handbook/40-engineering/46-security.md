# 09. Security

## 9.1 مدل تهدید گام اول

تهدیدهای واقعی:
- credential stuffing
- brute force login
- refresh token theft
- session replay
- tenant data leakage
- email verification token theft
- reset token replay
- privilege abuse via bad role checks
- sensitive data leakage in logs

گام اول باید علیه این‌ها جواب مشخص داشته باشد.

---

## 9.2 Passwords

- Argon2id
- password policy حداقلی: طول 12+, common-password blocklist در صورت امکان
- plaintext password هرگز log نشود
- hash migration strategy از روز اول در نظر گرفته شود

### Password change

با تغییر رمز:
- `password_changed_at` update شود
- همه‌ی sessionهای دیگر revoke شوند یا حداقل گزینه configurable داشته باشیم

توصیه من: revoke همه، چون امنیت مهم‌تر از راحتی اینجاست.

---

## 9.3 Email verification and reset tokens

- opaque random token، حداقل 32 بایت entropy
- ذخیره‌ی DB فقط hash token
- single-use
- expiry اجباری
- compare constant-time

### reset response

برای جلوگیری از email enumeration، پاسخ request-password-reset همیشه generic است.

---

## 9.4 Sessions

### مدل
- access token: 15 دقیقه
- refresh token: 30 روز
- refresh rotation: on every refresh
- reuse detection: enabled

### Access token claims
حداقل:
- `sub` = user id
- `sid` = session id
- `iss`
- `aud`
- `iat`
- `exp`
- optional: `amr`, `mfa`

### Refresh token storage
- cookie HttpOnly
- Secure در non-local
- SameSite=Lax
- path محدود به refresh endpoint در صورت امکان

### Cookie naming
- production: `__Host-refresh_token`
- local dev: `refresh_token`

---

## 9.5 MFA

گام اول فقط TOTP + recovery codes.

### قواعد
- factor بعد از verify فعال می‌شود
- recovery codeها hashed ذخیره می‌شوند
- regenerate باید codeهای قبلی را revoke کند
- login پس از password صحیح ولی قبل از MFA کامل، session کامل نسازد

پیشنهاد:
- یک pending auth challenge state کوتاه‌عمر بسازید، نه session کامل.

---

## 9.6 Rate limiting

### Public endpoints
- register
- login
- verify-email
- resend-verification
- request-password-reset
- reset-password
- refresh

### پیشنهاد اولیه
- login: 5 تلاش در دقیقه per IP+email
- reset request: 3 در 15 دقیقه per email/IP
- register: 5 در ساعت per IP
- refresh: 30 در 5 دقیقه per session

### Account lock
بعد از N خطای متوالی:
- lock کوتاه‌مدت exponential
- audit ثبت شود

---

## 9.7 Authorization

Role check ساده کافی نیست. در گام اول البته implementation سبک است، اما entry point یکتا داریم:

```ts
can(userId, tenantId, permission): Promise<boolean>
```

هیچ controller یا service دیگری حق تفسیر role map را به‌صورت ad hoc ندارد.

---

## 9.8 Secrets

Secrets شامل:
- JWT signing keys
- TOTP encryption key
- email provider key
- DB credentials
- Redis credentials

قوانین:
- از env یا secret manager
- versioned rotation plan
- never in logs
- never in exception messages

---

## 9.9 Logging and PII

لاگ‌ها باید حداقل‌گرایانه باشند.

نباید log شود:
- password
- token plaintext
- TOTP secret
- recovery code plaintext
- raw authorization header
- cookie values

ممکن است log شود، با masking:
- email
- IP
- user agent

---

## 9.10 Secure defaults

- CORS محدود
- Helmet / secure headers
- request body limits
- file upload disabled unless needed
- TLS termination required in non-local
- dependency scanning in CI

---

## 9.11 Audit-worthy actions

حداقل این‌ها باید audit شوند:
- register
- email verify
- login success/fail
- logout
- logout all
- password reset requested/completed
- mfa enabled/disabled
- recovery code used
- tenant switch
- membership created (register path)
- suspicious refresh reuse
