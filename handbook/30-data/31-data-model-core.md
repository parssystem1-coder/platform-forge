# 06. Data Model

## 6.1 اصل مدل داده

دو realm اصلی در گام اول داریم:

1. **Platform Identity Realm**: user, credential, session, mfa
2. **Tenant Realm**: tenant, membership, active tenant context, tenant-scoped audit

چیزی که عمداً نداریم:
- customer identities برای storefront
- billing entities
- entitlement entities

---

## 6.2 ER سطح بالا

```text
users
  1 -> 1 user_credentials
  1 -> n sessions
  1 -> n email_verification_tokens
  1 -> n password_reset_tokens
  1 -> n mfa_totp_factors
  1 -> n recovery_codes
  1 -> n memberships

tenants
  1 -> n memberships
  1 -> n tenant_domains (stub)

sessions
  1 -> n session_refresh_tokens

outbox_events (generic)
audit_logs (generic, optional tenant/user scoped)
```

---

## 6.3 طراحی کلیدها

- همه‌ی primary keyها: `uuid`
- در لایه‌ی اپلیکیشن تولید می‌شوند
- timestampها: `timestamptz`
- ایمیل: `citext`
- JSON سبک: `jsonb`

### دلیل

- UUID برای merge-safe بودن و توزیع بهتر
- timestamptz برای از بین بردن ابهام timezone
- citext برای یکتا بودن ایمیل بدون دردسر lower-case logic

---

## 6.4 جداول هویت

### users

| column | type | notes |
|--------|------|-------|
| id | uuid pk | app-generated |
| email | citext unique not null | normalized |
| email_verified_at | timestamptz null | null until verified |
| phone | text null | optional |
| phone_verified_at | timestamptz null | future use |
| display_name | text not null | |
| avatar_url | text null | |
| locale | text not null default `en-US` | |
| timezone | text not null default `UTC` | IANA timezone |
| status | text not null | `pending_verification`, `active`, `suspended` |
| created_at | timestamptz not null | |
| updated_at | timestamptz not null | |

### user_credentials

| column | type | notes |
|--------|------|-------|
| user_id | uuid pk fk users(id) | one-to-one |
| password_hash | text not null | Argon2id |
| password_changed_at | timestamptz not null | |
| failed_login_count | integer not null default 0 | |
| locked_until | timestamptz null | temporary lock |
| created_at | timestamptz not null | |
| updated_at | timestamptz not null | |

### email_verification_tokens

| column | type | notes |
|--------|------|-------|
| id | uuid pk | |
| user_id | uuid fk users(id) | |
| token_hash | text unique not null | SHA-256 of opaque token |
| expires_at | timestamptz not null | 24h |
| consumed_at | timestamptz null | single-use |
| created_at | timestamptz not null | |

### password_reset_tokens

همان الگو با TTL کوتاه‌تر، مثلاً 30 دقیقه.

---

## 6.5 MFA tables

### mfa_totp_factors

| column | type | notes |
|--------|------|-------|
| id | uuid pk | |
| user_id | uuid fk users(id) | |
| secret_ciphertext | bytea not null | encrypted at rest |
| secret_key_version | text not null | for rotation |
| label | text not null | device label |
| verified_at | timestamptz null | setup complete only after verify |
| created_at | timestamptz not null | |
| updated_at | timestamptz not null | |

### mfa_recovery_codes

| column | type | notes |
|--------|------|-------|
| id | uuid pk | |
| user_id | uuid fk users(id) | |
| code_hash | text unique not null | hashed |
| consumed_at | timestamptz null | single-use |
| created_at | timestamptz not null | |

---

## 6.6 Session model

### تصمیم مهم

Access token در DB ذخیره نمی‌شود.
Refresh token plaintext هم ذخیره نمی‌شود.
DB فقط fingerprint/hash و family state را نگه می‌دارد.

### sessions

| column | type | notes |
|--------|------|-------|
| id | uuid pk | |
| user_id | uuid fk users(id) | |
| status | text not null | `active`, `revoked`, `expired`, `compromised` |
| created_at | timestamptz not null | |
| last_seen_at | timestamptz not null | |
| revoked_at | timestamptz null | |
| revoke_reason | text null | |
| ip_address | inet null | first known |
| user_agent | text null | first known |
| device_name | text null | optional parsed device |
| current_refresh_token_id | uuid null | latest active token row |

### session_refresh_tokens

| column | type | notes |
|--------|------|-------|
| id | uuid pk | |
| session_id | uuid fk sessions(id) | |
| token_hash | text unique not null | hashed opaque token |
| family_id | uuid not null | ties rotation lineage |
| parent_token_id | uuid null | previous token in chain |
| issued_at | timestamptz not null | |
| expires_at | timestamptz not null | 30d or config |
| consumed_at | timestamptz null | set on rotation |
| revoked_at | timestamptz null | |
| replaced_by_token_id | uuid null | chain integrity |

### reuse detection

اگر refresh token مصرف‌شده دوباره ارائه شد:
- session `compromised` می‌شود
- تمام tokenهای family revoke می‌شوند
- کاربر باید دوباره login کند
- audit ثبت می‌شود

---

## 6.7 Tenancy

### tenants

| column | type | notes |
|--------|------|-------|
| id | uuid pk | |
| name | text not null | |
| slug | citext unique not null | |
| status | text not null | `active`, `suspended`, `archived` |
| locale | text not null | |
| timezone | text not null | |
| currency | text not null default `USD` | ISO-4217 |
| settings | jsonb not null default '{}' | lightweight only |
| created_at | timestamptz not null | |
| updated_at | timestamptz not null | |

### memberships

| column | type | notes |
|--------|------|-------|
| id | uuid pk | |
| tenant_id | uuid fk tenants(id) | |
| user_id | uuid fk users(id) | |
| role | text not null | `owner`, `admin`, `member`, `viewer` |
| status | text not null | `active`, `invited`, `suspended` |
| joined_at | timestamptz not null | |
| invited_by_user_id | uuid null fk users(id) | phase 2 use |
| created_at | timestamptz not null | |
| updated_at | timestamptz not null | |

Constraint:
- unique `(tenant_id, user_id)`

### active tenant preference

این را در گام اول داخل profile نگه نمی‌داریم.
Tenant فعال از request/header یا claim می‌آید و هر بار membership validate می‌شود.
این امن‌تر از cached active tenant بدون بررسی است.

---

## 6.8 Audit

### audit_logs

| column | type | notes |
|--------|------|-------|
| id | uuid pk | |
| occurred_at | timestamptz not null | |
| actor_user_id | uuid null | |
| tenant_id | uuid null | |
| session_id | uuid null | |
| action | text not null | e.g. `auth.login.succeeded` |
| target_type | text null | e.g. `user`, `session` |
| target_id | uuid null | |
| ip_address | inet null | |
| correlation_id | uuid not null | |
| metadata | jsonb not null default '{}' | sanitized |

append-only. update/delete ممنوع.

---

## 6.9 Outbox

### outbox_events

| column | type | notes |
|--------|------|-------|
| id | uuid pk | event id |
| aggregate_type | text not null | |
| aggregate_id | uuid not null | |
| tenant_id | uuid null | |
| event_type | text not null | |
| event_version | integer not null | default 1 |
| payload | jsonb not null | |
| occurred_at | timestamptz not null | domain time |
| available_at | timestamptz not null | retry/delay support |
| published_at | timestamptz null | |
| attempts | integer not null default 0 | |
| last_error | text null | |
| correlation_id | uuid not null | |
| causation_id | uuid null | |

Indexها:
- `(published_at, available_at)` partial where `published_at is null`
- `(aggregate_type, aggregate_id)`
- `(tenant_id, occurred_at)`

---

## 6.10 RLS scope

در گام اول فقط جداول tenant-bound باید RLS داشته باشند. یعنی:
- tenants
- memberships
- audit_logs (tenant-scoped rows)
- هر جدول tenant-bound بعدی

جداول platform-wide مثل `users` tenant-bound نیستند، اما دسترسی‌شان از application layer محدود می‌شود.

---

## 6.11 DDL reference

DDL کامل در `migrations/0001_init.sql` آمده و مرجع اجرایی است. این سند توضیح معماری می‌دهد، migration مرجع حقیقت اجراست.
