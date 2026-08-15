# 07. Multi-Tenancy and RLS

## 7.1 اصل حیاتی

Multi-tenancy این پروژه بر این فرض بنا می‌شود:

> باگ در application code اجتناب‌ناپذیر است. نشت tenant نباید با یک باگ ساده ممکن شود.

به همین دلیل، tenant isolation چهار لایه دارد:

1. Request tenant context
2. Membership validation
3. Repository-level tenant filtering
4. PostgreSQL RLS

RLS آخرین خط دفاع است، نه تنها خط دفاع.

---

## 7.2 مدل گام اول

- Shared database
- Shared schema
- Tenant-scoped rows via `tenant_id`
- PostgreSQL Row Level Security

این مدل در این مرحله بهترین trade-off است: ساده، سریع، قابل اتکا.

---

## 7.3 الگوی دسترسی به DB

### قانون

هر دسترسی به جدول tenant-bound فقط از داخل helper زیر انجام می‌شود:

```ts
withTenant(tenantId, fn)
```

این helper:

1. transaction باز می‌کند
2. `SET LOCAL app.tenant_id = '<uuid>'`
3. callback را اجرا می‌کند
4. commit/rollback می‌کند

### چرا `SET LOCAL`

- فقط در همان transaction معتبر است
- روی connection pool state نشت نمی‌دهد
- از `SET` ساده امن‌تر است

---

## 7.4 RLS policy pattern

نمونه policy:

```sql
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;

CREATE POLICY memberships_tenant_isolation
ON memberships
USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

برای جدول tenant:

```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

CREATE POLICY tenants_self_isolation
ON tenants
USING (id = current_setting('app.tenant_id', true)::uuid);
```

### FORCE RLS

مهم است. بدون آن بعضی owner roleها ممکن است bypass کنند.

---

## 7.5 نقش‌های دیتابیس

دو role اصلی:

- `platform_owner`: فقط migration/admin
- `platform_app`: role اجرای اپلیکیشن

قوانین:

- اپلیکیشن با `platform_app` وصل می‌شود
- `platform_app` مالک جدول‌ها نیست
- `BYPASSRLS` ندارد
- migrationها توسط role قوی‌تر اجرا می‌شوند

این یکی از رایج‌ترین جاهای خرابکاری تیم‌هاست.
اگر app role owner باشد، RLS را دور می‌زند و کل نمایش امنیتی تو fake می‌شود.

---

## 7.6 Tenant resolution

گام اول برای API این ترتیب را دارد:

1. `X-Tenant-Id` header اگر موجود و معتبر بود
2. در آینده: subdomain mapping
3. در آینده: custom domain mapping

بعد از resolution:

- membership کاربر در آن tenant چک می‌شود
- status membership باید active باشد
- tenant status باید active باشد

اگر هر کدام fail شد: request reject می‌شود.

---

## 7.7 جدول‌هایی که tenant-bound نیستند

- users
- user_credentials
- email_verification_tokens
- password_reset_tokens
- sessions
- session_refresh_tokens
- mfa tables

این‌ها platform-wide هستند و tenant_id ندارند.
این تصمیم آگاهانه است چون User متعلق به یک tenant نیست.

---

## 7.8 تست نشت tenant

یک suit اجباری لازم است:

### سناریوها

- user A در tenant A نمی‌تواند membershipهای tenant B را ببیند
- اگر repository filter فراموش شد، RLS هنوز query را محدود می‌کند
- اگر `withTenant` استفاده نشود، query fail یا empty شود
- switching tenant فقط در صورت membership مجاز است
- audit tenant-scoped خارج از tenant قابل خواندن نیست

### اصل

هر PR که query جدید tenant-bound اضافه می‌کند باید مورد تست نشت هم اضافه کند.

---

## 7.9 خطاهای معمول که باید ممنوع شوند

- query خارج از transaction tenant-aware
- relying only on `WHERE tenant_id = ?`
- app role با مجوز owner
- استفاده از connection-level `SET` به‌جای `SET LOCAL`
- repository generic که tenant filter را optional می‌گذارد

Optional tenant filter یعنی future breach.
