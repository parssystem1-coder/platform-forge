# 11. Testing Strategy

## 11.1 اصل

این پروژه امنیتی و چندمستاجری است. اگر تست‌ها shallow باشند، کل معماری تزئینی است.

ما ۵ لایه تست داریم:

1. unit
2. application/service
3. integration with real Postgres/Redis
4. e2e HTTP
5. architecture/boundary tests

---

## 11.2 Unit tests

هدف:
- domain invariantها
- password policy
- role/permission matrix
- token expiry logic
- session rotation state machine
- MFA verification rules

Unit test باید سریع باشد و DB نخواهد.

---

## 11.3 Integration tests

با Postgres واقعی:
- repositories
- migrations
- RLS policies
- `withTenant()` helper
- outbox persistence

با Redis واقعی:
- rate limiting
- idempotency cache behavior

---

## 11.4 E2E tests

سناریوهای اجباری:

1. register -> verify email -> login -> me
2. login fail with wrong password
3. login blocked when email unverified
4. refresh rotates token
5. refresh token reuse revokes session family
6. password reset happy path
7. MFA setup + verify + login with MFA
8. logout current session
9. logout all sessions
10. tenant list + switch

---

## 11.5 Tenant Leak Suite

این مهم‌ترین سوییت است.

### باید اثبات کند:
- کاربر tenant A داده‌ی tenant B را نمی‌بیند
- فراموشی where clause به نشت منجر نمی‌شود چون RLS عمل می‌کند
- بدون `SET LOCAL app.tenant_id`، query موفقِ خطرناک رخ نمی‌دهد
- active tenant spoof از header بدون membership رد می‌شود

### الزام

هر جدول tenant-bound جدید باید تست leak مخصوص خودش را داشته باشد.

---

## 11.6 Contract tests

- OpenAPI generated با routeهای واقعی هم‌خوان باشد
- problem codes از کاتالوگ خارج نشوند
- event payloadها با schema کاتالوگ تطابق داشته باشند

---

## 11.7 Architecture tests

CI باید fail کند اگر:
- domain از NestJS import کند
- moduleها circular dependency بسازند
- interfaces به infrastructure داخلی module دیگر دسترسی بگیرند

---

## 11.8 Performance smoke tests

در گام اول benchmark سنگین نمی‌خواهیم، ولی smoke test لازم داریم:
- login p95 under reasonable local/dev target
- refresh path stable under burst
- register path transactionally sound under concurrency

---

## 11.9 Seed and fixtures

Test data باید deterministic باشد:
- fixed clock
- seeded UUIDs where needed
- explicit tenants/users

فیکچرهای جادویی و shared mutable fixture ممنوع.
