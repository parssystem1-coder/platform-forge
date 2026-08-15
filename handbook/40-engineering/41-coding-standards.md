# 05. Coding Standards

## 5.1 اصل کلی

کد باید boring, explicit, testable باشد.
باهوش‌بازی، shortcut و abstraction زودهنگام ممنوع.

---

## 5.2 Naming

- Use caseها با فعل شروع شوند: `RegisterUser`, `LoginUser`, `SwitchTenant`
- Repositoryها بر اساس aggregate نام‌گذاری شوند: `UserRepository`, `SessionRepository`
- Domain eventها زمان گذشته داشته باشند: `UserRegistered`, `EmailVerified`
- Portها نیت را بگویند: `PasswordHasher`, `EmailSender`, `TokenSigner`

از اسم‌های مبهم مثل `Helper`, `Manager`, `CommonService`, `Util` استفاده نکن.

---

## 5.3 Controllers

Controller مجاز است:

- DTO parse/validate کند
- principal را از request بخواند
- use case را صدا بزند
- پاسخ را map کند

Controller مجاز نیست:

- transaction باز کند
- query DB بزند
- logic تصمیم‌گیری داشته باشد
- authorization rule را از نو تفسیر کند

---

## 5.4 Use Cases

هر use case باید:

- ورودی صریح داشته باشد
- خروجی صریح داشته باشد
- transaction boundary مشخص داشته باشد
- خطاهای domain/application معنادار پرتاب کند
- audit/outbox را orchestrate کند اگر لازم است

Use case نباید:

- HTTP status code بشناسد
- response header ست کند
- به framework primitive وابسته باشد

---

## 5.5 Domain

Domain باید:

- invariantها را enforce کند
- ruleهای واقعی را در خود نگه دارد
- مستقل از framework باشد

مثال:

- ایمیل تأییدنشده نمی‌تواند session فعال بگیرد
- recovery code فقط یک‌بار مصرف است
- session revoked نمی‌تواند refresh شود

---

## 5.6 Errors

همه‌ی خطاها باید machine-readable code داشته باشند.

نمونه:

- `identity.email_already_used`
- `identity.invalid_credentials`
- `identity.email_not_verified`
- `identity.mfa_required`
- `identity.invalid_totp`
- `tenancy.membership_not_found`
- `authz.forbidden`

در edge layer همه به problem+json map می‌شوند.

---

## 5.7 Transactions

هر use case نوشتنی یا read-write باید خودش transaction boundary روشن داشته باشد.
Repositoryها transaction را «یواشکی» باز نکنند مگر explicitly از transaction context استفاده کنند.

قانون tenant-aware read/write:

- اگر query به tenant-bound table می‌رسد، فقط داخل `withTenant()` اجرا شود.

---

## 5.8 Time / IDs / randomness

- زمان از `Clock` interface خوانده شود
- UUID از `IdGenerator` interface ساخته شود
- tokenها از `SecureRandom` adapter ساخته شوند

این‌ها برای testability حیاتی‌اند.

---

## 5.9 Comments

کامنت برای توضیح «چرا» است، نه «چی».
اگر لازم است کد را line by line توضیح بدهی، کد بد است.

---

## 5.10 Migrations

- SQL migrationها immutable هستند
- migration قبلی را rewrite نکن
- هر migration باید reversible plan در doc داشته باشد، حتی اگر down script رسمی نداریم

---

## 5.11 Logs

لاگ باید ساختاریافته و event-oriented باشد.

بد:

```text
something went wrong
```

خوب:

```json
{
  "event": "auth.login.failed",
  "reason": "invalid_password",
  "requestId": "...",
  "correlationId": "...",
  "email": "masked"
}
```

---

## 5.12 Security hygiene

- secret در log ممنوع
- token plaintext در DB ممنوع
- email enumeration در response ممنوع
- comparison حساس باید constant-time باشد
- audit append-only است

---

## 5.13 Definition of merge-ready code

یک PR فقط وقتی merge-ready است که:

- tests سبز
- boundaries enforce شده
- OpenAPI update شده
- migration review شده
- doc impact ثبت شده
- security-sensitive changes reviewer دوم دارد
