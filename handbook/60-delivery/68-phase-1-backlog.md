# بک‌لاگ اجرایی فاز ۱

## هدف فاز

در پایان این فاز، یک Tenant User بتواند ثبت‌نام کند، ایمیل را تأیید کند، وارد شود، Tenant خود را ببیند و سوییچ کند؛ بدون اینکه داده Tenant دیگری را ببیند.

## Sprint 0: Foundation

| ID | تسک | خروجی | تخمین |
| --- | --- | --- | --- |
| F1-001 | ساخت pnpm workspace و Turbo | repo قابل build | ۲h |
| F1-002 | ساخت apps/api و apps/worker | دو process جدا | ۲h |
| F1-003 | اضافه کردن TypeScript strict و lint | quality baseline | ۲h |
| F1-004 | Docker Compose برای Postgres/Redis/Mailpit | local infra | ۲h |
| F1-005 | env schema و secret validation | config امن | ۲h |
| F1-006 | CI نصب، lint، typecheck | PR gate | ۲h |
| F1-007 | dependency-cruiser | architecture gate | ۲h |

## Sprint 1: Database and Kernel

| ID | تسک | خروجی | تخمین |
| --- | --- | --- | --- |
| F1-008 | migration runner | اجرای versioned SQL | ۳h |
| F1-009 | ساخت DB roles | app بدون مالکیت | ۲h |
| F1-010 | اجرای core migration | tables + constraints | ۳h |
| F1-011 | RLS policies و FORCE RLS | isolation baseline | ۳h |
| F1-012 | UnitOfWork و withTenant | transaction context | ۳h |
| F1-013 | request/correlation context | AsyncLocalStorage | ۲h |
| F1-014 | Problem Details mapper | error contract | ۲h |
| F1-015 | healthz/readyz/metrics | operational baseline | ۲h |
| F1-016 | Tenant Leak Suite اولیه | اثبات isolation | ۴h |

## Sprint 2: Registration and Verification

| ID | تسک | خروجی | تخمین |
| --- | --- | --- | --- |
| F1-017 | User domain entity | invariantهای User | ۳h |
| F1-018 | Credential repository و Argon2id | password storage | ۳h |
| F1-019 | RegisterUser use case | User + Tenant + Membership atomic | ۴h |
| F1-020 | Email token service | hash + TTL + single-use | ۳h |
| F1-021 | Email adapter و Mailpit | verification email | ۲h |
| F1-022 | register endpoint | REST contract | ۲h |
| F1-023 | verify endpoint | activate user | ۲h |
| F1-024 | e2e register-to-verify | acceptance proof | ۳h |

## Sprint 3: Login and Sessions

| ID | تسک | خروجی | تخمین |
| --- | --- | --- | --- |
| F1-025 | Session aggregate | lifecycle rules | ۳h |
| F1-026 | JWT signing port | access token | ۲h |
| F1-027 | Opaque refresh token store | hashed token | ۳h |
| F1-028 | Login use case | credential + verification | ۴h |
| F1-029 | Refresh rotation | chain + parent | ۴h |
| F1-030 | Reuse detection | compromise session family | ۳h |
| F1-031 | Logout/current/all | revoke flows | ۳h |
| F1-032 | rate limit login/refresh | abuse defense | ۲h |
| F1-033 | e2e session suite | acceptance proof | ۴h |

## Sprint 4: Authorization and Tenant Context

| ID | تسک | خروجی | تخمین |
| --- | --- | --- | --- |
| F1-034 | Permission registry | stable keys | ۲h |
| F1-035 | Role registry | owner/admin/member/viewer | ۲h |
| F1-036 | authorize service | one decision point | ۴h |
| F1-037 | tenant resolver | header + membership | ۳h |
| F1-038 | me/tenants endpoints | context visibility | ۲h |
| F1-039 | tenant switch endpoint | membership validation | ۲h |
| F1-040 | authorization matrix tests | role coverage | ۳h |
| F1-041 | cross-tenant e2e tests | no leakage | ۴h |

## Sprint 5: Recovery and MFA

| ID | تسک | خروجی | تخمین |
| --- | --- | --- | --- |
| F1-042 | password reset request | generic response | ۲h |
| F1-043 | password reset completion | token single-use | ۳h |
| F1-044 | TOTP setup challenge | secret encrypted | ۳h |
| F1-045 | TOTP verification | enable factor | ۳h |
| F1-046 | recovery code generation | hashed one-use codes | ۲h |
| F1-047 | MFA login challenge | no full session before MFA | ۴h |
| F1-048 | security e2e suite | acceptance proof | ۴h |

## Sprint 6: Outbox, Audit, Release

| ID | تسک | خروجی | تخمین |
| --- | --- | --- | --- |
| F1-049 | domain event envelopes | versioned events | ۲h |
| F1-050 | transactional outbox writer | same transaction | ۳h |
| F1-051 | publisher worker | retry/backoff/dead letter | ۴h |
| F1-052 | audit writer | append-only trail | ۳h |
| F1-053 | consumer idempotency | duplicate-safe | ۳h |
| F1-054 | OpenAPI generation/check | API drift prevention | ۲h |
| F1-055 | production env checklist | deploy readiness | ۲h |
| F1-056 | full Definition of Done review | phase gate | ۴h |

## ترتیب اجرا

تسک‌ها را موازی نکن مگر وابستگی جدول بالا اجازه دهد. ترتیب صحیح:

```text
Foundation
 -> DB/RLS
 -> Kernel
 -> Register/Verify
 -> Login/Session
 -> Authorization/Tenant Context
 -> MFA/Recovery
 -> Outbox/Audit
 -> Gate 1
```

## خروجی قابل نمایش به کارفرما

در پایان فاز، یک ویدیو یا دمو باید این مسیر را نشان دهد:

```text
Register
 -> Verify email in Mailpit
 -> Login
 -> See Tenant A
 -> Switch Tenant B
 -> Call protected endpoint
 -> Show Tenant B data
 -> Attempt Tenant A data
 -> Receive safe denial
 -> Revoke session
 -> Refresh fails
```
