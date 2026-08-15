# طراحی Identity فاز ۱

## مدل‌ها

```text
User
 ├── Credential
 ├── Session[]
 ├── EmailVerificationToken[]
 ├── PasswordResetToken[]
 ├── TotpFactor[]
 └── RecoveryCode[]
```

## User invariantها

- email normalized و globally unique است
- user تأییدنشده active نیست
- user suspended نمی‌تواند login کامل بگیرد
- حذف مستقیم User در فاز ۱ نداریم؛ lifecycle بعداً اضافه می‌شود

## Credential invariantها

- فقط Argon2id
- failed login count قابل reset بعد از login موفق
- lock موقت با backoff
- password change تمام sessionهای دیگر را revoke می‌کند

## Session state machine

```text
active -> revoked
active -> expired
active -> compromised
```

`compromised` نتیجه reuse detection است و با logout عادی یکی نیست.

## Token policy

| token | storage | lifetime | rotation |
| --- | --- | ---: | --- |
| access | memory/client response | 15m | هر refresh |
| refresh | HttpOnly cookie + hash DB | 30d | هر استفاده |
| email verification | hash DB | 24h | single-use |
| password reset | hash DB | 30m | single-use |
| MFA challenge | Redis یا DB کوتاه‌عمر | 5m | single-use |
