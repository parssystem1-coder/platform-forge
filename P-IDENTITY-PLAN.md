# P-IDENTITY Phase Plan

**فاز:** P-IDENTITY - Identity + Tenancy + Authorization  
**تاریخ:** 2026-08-15  
**معمار:** Platform-Forge Agent  
**وضعیت:** آماده برای اجرا

---

## ۱. هدف فاز

پیاده‌سازی کامل سیستم هویت شامل:
- ثبت‌نام و احراز هویت کاربران
- مدیریت مستاجران (Tenant)
- سیستم Membership
- مدیریت نشست‌ها (Sessions)
- چرخش توکن‌ها
- تأیید ایمیل
- MFA (TOTP)
- Authorization برای ۴ قلمرو

---

## ۲. خارج از دامنه (Out of Scope)

- **Billing و Subscription** → فاز P-BILLING
- **Feature Flags و Quota** → فاز P-FEATURES
- **Worker و Notification** → فاز P-RELIABILITY
- **AI Gateway** → فاز P-AI
- **Plugin System** → فاز P-ECOSYSTEM
- **CRM/SEO** → پروژه جداگانه

---

## ۳. وابستگی‌ها

| وابستگی | وضعیت | توضیح |
|---|---|---|
| P-DEBT (کدی) | ✅ انجام شده | UnitOfWork, Authorization, Quota |
| P-DEBT (DB) | ⏳ در انتظار | RLS, Bootstrap Roles |
| Error Catalog v2 | ✅ آماده | errors.md v2 کامل |
| ADR-0003 Session | ✅ آماده | Session architecture |
| ADR-0004 AuthZ | ✅ آماده | Unified authorization |

---

## ۴. ماژول‌های قابل تحویل

### ۴.۱ Identity Module
```
modules/identity/
├── domain/
│   ├── user.entity.ts
│   ├── credential.entity.ts
│   ├── email-verification.entity.ts
│   ├── password-reset.entity.ts
│   ├── mfa-totp.entity.ts
│   └── errors.ts
├── application/
│   ├── register-user.use-case.ts
│   ├── login.use-case.ts
│   ├── logout.use-case.ts
│   ├── refresh-token.use-case.ts
│   ├── verify-email.use-case.ts
│   ├── request-password-reset.use-case.ts
│   ├── reset-password.use-case.ts
│   ├── enable-mfa.use-case.ts
│   ├── verify-mfa.use-case.ts
│   └── ports.ts
├── infrastructure/
│   ├── password-hasher.ts (Argon2id)
│   ├── token-service.ts (JWT)
│   └── email-service.ts
└── interfaces/
    └── auth.controller.ts (REST)
```

### ۴.۲ Tenancy Module
```
modules/tenancy/
├── domain/
│   ├── tenant.entity.ts
│   ├── membership.entity.ts
│   └── errors.ts
├── application/
│   ├── create-tenant.use-case.ts
│   ├── list-user-tenants.use-case.ts
│   ├── switch-tenant.use-case.ts
│   ├── invite-member.use-case.ts
│   ├── remove-member.use-case.ts
│   ├── update-member-role.use-case.ts
│   └── ports.ts
└── interfaces/
    └── tenants.controller.ts (REST)
```

### ۴.۳ Access Control Module
```
modules/access-control/
├── domain/
│   ├── permission.ts
│   ├── role.ts
│   └── errors.ts
├── application/
│   ├── authorize.use-case.ts
│   ├── authorize-customer.use-case.ts
│   ├── check-feature.use-case.ts
│   └── ports.ts
└── infrastructure/
    ├── membership-reader.ts
    ├── role-registry.ts
    └── feature-resolver.ts
```

---

## ۵. تسک‌های اجرایی (حداکثر ۴ ساعت)

### Sprint 1: Identity Foundation (روز ۱-۲)

| ID | تسک | تخمین | وابستگی |
|---|---|---|---|
| I-01 | پیاده‌سازی User Entity و Repository | 3h | - |
| I-02 | پیاده‌سازی Password Hasher (Argon2id) | 2h | I-01 |
| I-03 | پیاده‌سازی Register Use Case | 3h | I-01, I-02 |
| I-04 | پیاده‌سازی Login Use Case | 3h | I-01, I-02 |
| I-05 | پیاده‌سازی Token Service (JWT) | 2h | I-04 |
| I-06 | پیاده‌سازی Session Management | 3h | I-05 |
| I-07 | پیاده‌سازی Refresh Token Rotation | 3h | I-06 |
| I-08 | تست‌های واحد Identity | 2h | I-03..I-07 |

### Sprint 2: Email Verification + Password Reset (روز ۳)

| ID | تسک | تخمین | وابستگی |
|---|---|---|---|
| I-09 | پیاده‌سازی Email Verification Entity | 2h | I-01 |
| I-10 | پیاده‌سازی Verify Email Use Case | 2h | I-09 |
| I-11 | پیاده‌سازی Password Reset Entity | 2h | I-01 |
| I-12 | پیاده‌سازی Request/Reset Password Use Cases | 3h | I-11 |
| I-13 | تست‌های Email و Password Reset | 2h | I-10..I-12 |

### Sprint 3: MFA (روز ۴)

| ID | تسک | تخمین | وابستگی |
|---|---|---|---|
| I-14 | پیاده‌سازی TOTP Entity و Service | 3h | I-01 |
| I-15 | پیاده‌سازی Enable MFA Use Case | 3h | I-14 |
| I-16 | پیاده‌سازی Verify MFA Use Case | 2h | I-14 |
| I-17 | تست‌های MFA | 2h | I-15, I-16 |

### Sprint 4: Tenancy (روز ۵-۶)

| ID | تسک | تخمین | وابستگی |
|---|---|---|---|
| T-01 | پیاده‌سازی Tenant Entity | 2h | - |
| T-02 | پیاده‌سازی Membership Entity | 2h | T-01 |
| T-03 | پیاده‌سازی Create Tenant Use Case | 3h | T-01, T-02 |
| T-04 | پیاده‌سازی List User Tenants | 2h | T-02 |
| T-05 | پیاده‌سازی Switch Tenant | 3h | T-04 |
| T-06 | پیاده‌سازی Invite/Remove Member | 3h | T-02 |
| T-07 | تست‌های Tenancy | 2h | T-03..T-06 |

### Sprint 5: Authorization (روز ۷)

| ID | تسک | تخمین | وابستگی |
|---|---|---|---|
| A-01 | پیاده‌سازی Role Registry | 2h | - |
| A-02 | پیاده‌سازی Permission System | 3h | A-01 |
| A-03 | پیاده‌سازی authorizeCustomer | 3h | A-02 |
| A-04 | تست‌های Authorization | 2h | A-01..A-03 |

### Sprint 6: REST API (روز ۸)

| ID | تسک | تخمین | وابستگی |
|---|---|---|---|
| R-01 | REST Endpoints Identity | 3h | I-03..I-07 |
| R-02 | REST Endpoints Tenancy | 3h | T-03..T-06 |
| R-03 | REST Endpoints Authorization | 2h | A-01..A-03 |
| R-04 | OpenAPI به‌روزرسانی | 2h | R-01..R-03 |

### Sprint 7: Testing & Integration (روز ۹-۱۰)

| ID | تسک | تخمین | وابستگی |
|---|---|---|---|
| IT-01 | تست‌های Integration | 4h | همه |
| IT-02 | Tenant Leak Test | 3h | DB migrations |
| IT-03 | API E2E Tests | 4h | R-01..R-03 |

---

## ۶. Migration Plan

### جدول‌های جدید

```sql
-- Phase 1: Identity + Tenancy
CREATE TABLE users (...)              -- 0001_core.sql
CREATE TABLE user_credentials (...)    -- 0001_core.sql
CREATE TABLE sessions (...)           -- 0001_core.sql
CREATE TABLE session_refresh_tokens (...) -- 0001_core.sql
CREATE TABLE email_verification_tokens (...) -- 0001_core.sql
CREATE TABLE password_reset_tokens (...) -- 0001_core.sql
CREATE TABLE mfa_totp_factors (...)  -- 0001_core.sql
CREATE TABLE mfa_recovery_codes (...) -- 0001_core.sql
CREATE TABLE tenants (...)            -- 0001_core.sql
CREATE TABLE memberships (...)        -- 0001_core.sql
```

### RLS Policies

```sql
-- Users: platform-wide (no tenant)
-- Sessions: platform-wide
-- Tenants: three policies (active, membership, provisioning)
-- Memberships: two policies (tenant context, provisioning)
```

---

## ۷. API Contracts

### Identity Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | ثبت‌نام کاربر جدید |
| POST | `/api/v1/auth/login` | ورود |
| POST | `/api/v1/auth/logout` | خروج |
| POST | `/api/v1/auth/refresh` | تجدید توکن |
| POST | `/api/v1/auth/verify-email` | تأیید ایمیل |
| POST | `/api/v1/auth/request-password-reset` | درخواست بازنشانی رمز |
| POST | `/api/v1/auth/reset-password` | بازنشانی رمز |
| POST | `/api/v1/auth/mfa/enable` | فعال‌سازی MFA |
| POST | `/api/v1/auth/mfa/verify` | تأیید MFA |
| GET | `/api/v1/auth/me` | اطلاعات کاربر جاری |

### Tenancy Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/tenants` | ایجاد مستاجر جدید |
| GET | `/api/v1/tenants` | لیست مستاجرهای کاربر |
| GET | `/api/v1/tenants/:id` | جزئیات مستاجر |
| PATCH | `/api/v1/tenants/:id` | به‌روزرسانی مستاجر |
| POST | `/api/v1/tenants/:id/switch` | سوییچ به مستاجر |
| POST | `/api/v1/tenants/:id/members` | دعوت عضو |
| DELETE | `/api/v1/tenants/:id/members/:userId` | حذف عضو |
| PATCH | `/api/v1/tenants/:id/members/:userId` | تغییر نقش |

### Authorization Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/permissions` | لیست دسترسی‌ها |
| GET | `/api/v1/roles` | لیست نقش‌ها |

---

## ۸. Error Codes (جدید)

```typescript
// Identity (بخشی از errors.md v2)
'identity.registration_disabled'    // 403
'identity.weak_password'           // 422
'identity.mfa_setup_failed'       // 500

// Tenancy (بخشی از errors.md v2)
'tenancy.membership_exists'        // 409
'tenancy.owner_cannot_leave'      // 409
'tenancy.cannot_remove_last_owner' // 409

// Authz (گسترش‌یافته)
'authz.insufficient_scope'         // 403
'authz.feature_disabled'          // 402
```

---

## ۹. Events (جدید)

```typescript
// Identity Events
'identity.user_registered'
'identity.email_verification_sent'
'identity.email_verified'
'identity.login_succeeded'
'identity.login_failed'
'identity.password_reset_requested'
'identity.password_reset_completed'
'identity.mfa_enabled'
'identity.mfa_disabled'
'identity.session_created'
'identity.session_revoked'
'identity.refresh_token_rotated'
'identity.refresh_token_reused'  // امنیتی

// Tenancy Events
'tenancy.tenant_created'
'tenancy.tenant_updated'
'tenancy.member_invited'
'tenancy.member_joined'
'tenancy.member_removed'
'tenancy.member_role_changed'
```

---

## ۱۰. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Race Condition در تولید slug | MEDIUM | Uniqueness constraint + retry |
| Token theft | HIGH | Refresh token rotation + reuse detection |
| Brute force login | MEDIUM | Rate limiting + account lockout |
| Email verification token leak | MEDIUM | Single-use + expiration |
| Tenant data isolation failure | CRITICAL | RLS + WITH CHECK + tenant-leak tests |

---

## ۱۱. Open Questions

| Question | Status | Decision |
|---|---|---|
| آیا امکان SSO وجود دارد؟ | OPEN | در P-IDENTITY نه، در P-PLATFORM-API |
| آیا OAuth2 پشتیبانی شود؟ | OPEN | در P-IDENTITY نه، در P-PLATFORM-API |
| حداکثر تعداد مستاجر برای هر کاربر؟ | OPEN | فعلاً نامحدود |
| سیاست قفل حساب بعد از چند تلاش؟ | OPEN | ۵ تلاش ناموفق = ۱۵ دقیقه قفل |

---

## ۱۲. Acceptance Tests

### Identity
- [ ] ثبت‌نام با ایمیل معتبر → ایمیل تأیید ارسال می‌شود
- [ ] ثبت‌نام با ایمیل تکراری → 409
- [ ] ورود با رمز صحیح → JWT صادر می‌شود
- [ ] ورود با رمز غلط → 401 + attempt logged
- [ ] ورود با MFA فعال → OTP مورد نیاز
- [ ] Refresh token منقضی → 401
- [ ] Refresh token reuse → همه tokenها باطل می‌شوند
- [ ] تأیید ایمیل → اکانت فعال می‌شود
- [ ] لینک تأیید منقضی → 400

### Tenancy
- [ ] ایجاد مستاجر → Tenant + Membership برای owner
- [ ] لیست مستاجرهای کاربر → فقط مستاجرهای عضو
- [ ] سوییچ به مستاجر → context تغییر می‌کند
- [ ] دعوت عضو → ایمیل دعوت ارسال می‌شود
- [ ] حذف آخرین owner → 409
- [ ] RLS: کاربر A نمی‌تواند داده B را بخواند

### Authorization
- [ ] کاربر با permission صحیح → access granted
- [ ] کاربر بدون permission → 403
- [ ] Machine client با scope → access granted
- [ ] Machine client بدون scope → 403
- [ ] Customer با ownership → access granted
- [ ] Customer بدون ownership → 403
- [ ] Staff با impersonation → audit log دارد

---

## ۱۳. Rollback Plan

### در صورت شکست
1. Revert code changes به commit قبلی
2. Revert migrations با down migration files
3. تست‌های قبلی باید سبز بمانند

### Critical Path
- ثبت‌نام/ورود نباید بشکند (auth مادر همه چیز است)
- RLS باید همیشه فعال باشد

---

## ۱۴. Definition of Done

فاز P-IDENTITY فقط وقتی تمام است که:

1. ✅ تمام use caseها پیاده‌سازی شده باشند
2. ✅ تمام REST endpoints کار کنند
3. ✅ OpenAPI به‌روز باشد
4. ✅ Error codes در errors.md ثبت شده باشند
5. ✅ Events در events.md ثبت شده باشند
6. ✅ Migrations اجرا شده باشند
7. ✅ تست‌های واحد سبز باشند
8. ✅ تست‌های integration سبز باشند
9. ✅ tenant-leak test سبز باشد
10. ✅ Audit trail برای staff access کار کند
11. ✅ pnpm verify سبز باشد
12. ⏳ NEXT_PHASE.md وجود داشته باشد

---

## ۱۵. تخمین کل

| Sprint | مدت | تمرکز |
|---|---|---|
| Sprint 1 | ۲ روز | Identity Foundation |
| Sprint 2 | ۱ روز | Email + Password Reset |
| Sprint 3 | ۱ روز | MFA |
| Sprint 4 | ۲ روز | Tenancy |
| Sprint 5 | ۱ روز | Authorization |
| Sprint 6 | ۱ روز | REST API |
| Sprint 7 | ۲ روز | Testing |
| **جمع** | **۱۰ روز** | |

