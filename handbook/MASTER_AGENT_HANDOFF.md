> # ⚠ الزامات اصلاحیه نسخه ۳
>
> این فایل قرارداد مادر می‌ماند، با دو اصلاح:
>
> 1. **بند ۵ (فازبندی) باطل است.** نقشه مرجع: `99-amendment/05-canonical-phase-map.md`.
>    شماره‌های این بند با نام پوشه‌های واقعی تطابق ندارد (یافته F-023).
> 2. **زنجیره مرجعیت بند ۱ اصلاح شد.** رده دوم دیگر
>    `05-completeness-check.md` نیست (آن فایل همه‌چیز را تیک زده در حالی که
>    هیچ کدی وجود ندارد). رده دوم: `99-amendment/01-findings-register.md`.
>
> زنجیره مرجعیت جدید:
>
> ```text
> 1. MASTER_AGENT_HANDOFF.md
> 2. 99-amendment/  (رجیستری یافته‌ها، نقشه فاز، وضعیت artefact)
> 3. ADRهای 80-adr/  (شامل 0015..0021)
> 4. قراردادهای 70-contracts/
> 5. سند فاز جاری
> 6. کد موجود
> 7. فرض شخصی Agent
> ```
>
> و یک قانون جدید: تا وقتی یک یافته S0 در رجیستری باز است، نه feature جدید
> مجاز است و نه سند فاز جدید.

# MASTER AGENT HANDOFF

## مأموریت

تو Coding/Architecture Agent ارشد این پروژه هستی. باید یک SaaS Platform چندمستاجری، ماژولار، API-first و قابل توسعه را از صفر تا production بسازی. Commerce اولین دامنه قابل فروش است، اما هویت سیستم نیست. بعداً CRM، SEO، Accounting، Support، Analytics، AI، Automation، MCP، Plugin و Marketplace باید بدون بازنویسی Platform Core اضافه شوند.

این فایل قرارداد مادر است. قبل از هر تغییر کد، آن را بخوان و رعایت کن.

---

## ۱. ترتیب مرجع اسناد

اگر بین اسناد قدیمی و جدید تناقض دیدی، این اولویت را رعایت کن:

1. `MASTER_AGENT_HANDOFF.md`
2. `00-executive/05-completeness-check.md`
3. ADRهای `80-adr/`
4. قراردادهای `70-contracts/`
5. سند فاز جاری در `60-delivery/`
6. کد موجود
7. فرض شخصی Agent

اگر تناقض حل‌نشدنی بود، کد نزن. یک `OPEN_QUESTION.md` بساز و توقف کن.

---

## ۲. قانون طلایی محصول

```text
User
 -> Identity
 -> Tenant Context
 -> Membership
 -> Authorization
 -> Feature
 -> Quota
 -> Application Service
 -> Domain
 -> Repository
 -> PostgreSQL
 -> Outbox
 -> Worker / Read Model / Integration
```

هیچ Interface، Agent، Plugin، n8n، Webhook یا Worker حق ندارد این مسیر را دور بزند.

---

## ۳. قوانین معماری غیرقابل مذاکره

### Layering

```text
interfaces -> application -> domain
infrastructure -> ports of application/domain
```

- Domain به NestJS، ORM، HTTP، Redis، env یا logger وابسته نیست.
- Controller فقط validate، call use case و map response می‌کند.
- Application Service مالک عملیات کسب‌وکار است.
- Infrastructure فقط Adapter است.
- ماژول‌ها فقط از public contract ماژول دیگر استفاده می‌کنند.
- import مسیر داخلی ماژول دیگر ممنوع است.
- circular dependency ممنوع است.

### Tenancy

- User متعلق به Tenant نیست.
- Membership رابطه User و Tenant است.
- هر query روی جدول tenant-bound فقط داخل `withTenant(tenantId, fn)` اجرا می‌شود.
- tenant context با `SET LOCAL` تنظیم می‌شود، نه `SET`.
- DB role اپلیکیشن owner جدول نیست و `BYPASSRLS` ندارد.
- هر جدول دارای `tenant_id` باید RLS و FORCE RLS داشته باشد.
- هر جدول tenant-bound جدید باید Tenant Leak Test داشته باشد.

### Access Control

- تنها نقطه تصمیم `authorize(actor, permission, resource, options)` است.
- مقایسه مستقیم role خارج از access-control ممنوع.
- Permission یعنی کاربر مجاز است.
- Feature یعنی Tenant قابلیت را دارد.
- Quota یعنی ظرفیت مصرف باقی مانده.
- در فاز ۱ Feature و Quota adapter ساده هستند، اما signature نهایی را تغییر نده.
- Customer/Shopper Permission پلتفرم ندارد؛ ownership-based است.

### Security

- password فقط Argon2id.
- refresh token opaque و فقط hash آن در DB.
- refresh rotation و reuse detection اجباری.
- token، password، secret، TOTP secret و recovery code در log ممنوع.
- خطاها RFC 9457 و machine-readable هستند.
- rate limit روی endpointهای عمومی اجباری است.

### Writes and Events

- هر write مهم: data + audit + outbox در همان transaction.
- انتشار مستقیم event از request ممنوع.
- Outbox at-least-once است؛ consumer باید idempotent باشد.
- Worker منطق کسب‌وکار جدید نمی‌سازد؛ Use Case موجود را صدا می‌زند.

### Money and Quota

- پول integer minor units است، نه float.
- Ledger دوطرفه و immutable است.
- اصلاح مالی با reversing entry است، نه UPDATE.
- quota با reserve/commit/release و conditional UPDATE اتمیک است.
- downgrade هیچ داده‌ای را حذف نمی‌کند.

---

## ۴. مدل ماژول‌ها

### Platform Core

`platform-kernel`, `identity`, `tenancy`, `access-control`, `audit`, `outbox`, `billing`, `metering`, `notifications`, `domains`.

### Domain Modules

`commerce`, `crm`, `seo`, `accounting`, `support`, `analytics`.

### Extension Layer

`public-api`, `webhooks`, `ai-gateway`, `automation`, `mcp`, `plugins`, `marketplace`.

هر ماژول جدید باید تحویل دهد:

1. Domain entities/invariants
2. Application use cases
3. Ports and adapters
4. Migration and RLS policy
5. Permission registry
6. Feature/Quota keys
7. Event catalog
8. REST/OpenAPI contract
9. Unit, integration, e2e, tenant-leak tests
10. Runbook and documentation

---

## ۵. فازبندی اجباری

```text
Phase 0  Foundation
Phase 1  Identity + Tenancy + Authorization
Phase 2  Commerce MVP
Phase 3  Workers + Notifications + Reliability
Phase 4  Features + Plans
Phase 5  Billing + Ledger
Phase 6  Usage + Quota
Phase 7  Domains + Public API + Webhooks
Phase 8  AI Gateway
Phase 9  Automation
Phase 10 MCP + Agents
Phase 11 CRM/SEO/other domains
Phase 12 Plugins + Marketplace
Phase 13 Enterprise infrastructure
```

فاز جاری را از `README.md` و آخرین پوشه `60-delivery/` تشخیص بده. فاز بعدی را بدون Gate فاز قبلی شروع نکن.

---

## ۶. روش اجرای هر تسک

برای هر تسک دقیقاً این کار را انجام بده:

1. سند فاز و قرارداد مرتبط را بخوان.
2. معیار پذیرش را به test تبدیل کن.
3. اگر ambiguity وجود دارد، `OPEN_QUESTION.md` تولید کن و توقف کن.
4. Domain را پیاده کن.
5. Application Use Case را پیاده کن.
6. Port و Adapter را پیاده کن.
7. Migration و RLS را اضافه کن.
8. REST/OpenAPI و error catalog را اضافه کن.
9. Audit/Outbox را در transaction اضافه کن.
10. Unit + integration + e2e + leak test بنویس.
11. `pnpm verify` را اجرا کن.
12. مستندات و traceability matrix را به‌روز کن.
13. یک commit کوچک و معنادار بساز.

هیچ task بزرگ‌تر از ۴ ساعت نباشد.

---

## ۷. چیزهایی که Agent نباید بسازد

تا وقتی فازش نرسیده:

- Microservices
- Kubernetes
- Kafka
- Service Mesh
- Multi-region
- OpenSearch
- Vector DB جدا
- Plugin Sandbox پیچیده
- Marketplace
- n8n به‌عنوان dependency هسته
- AI provider call از داخل Domain Module
- query مستقیم Plugin/MCP/Agent به DB
- entitlement پیچیده قبل از Feature واقعی

Future-ready یعنی contract و boundary آماده، نه ساختن همه‌چیز از روز اول.

---

## ۸. Definition of Done عمومی

یک قابلیت فقط وقتی done است که:

- مسیر happy path کار کند.
- خطاها تعریف و مستند باشند.
- authorization داشته باشد.
- tenant isolation تست شده باشد.
- migration امن باشد.
- Audit و Outbox موردنیاز ثبت شوند.
- OpenAPI به‌روز باشد.
- observability داشته باشد.
- unit/integration/e2e سبز باشند.
- dependency boundary سبز باشد.
- runbook و documentation به‌روز باشد.

---

## ۹. خروجی اجباری قبل از شروع هر فاز

Agent باید یک فایل بسازد:

```text
PHASE_PLAN.md
```

با این بخش‌ها:

- هدف فاز
- خارج از دامنه
- وابستگی‌ها
- تسک‌های حداکثر ۴ ساعته
- migration plan
- API/events changes
- risks
- open questions
- acceptance tests
- rollback plan

قبل از تولید کد سنگین، این plan باید review شود.

---

## ۱۰. معیار معماری سالم

اگر فردا بگوییم CRM اضافه کن، باید بتوانی یک module جدید اضافه کنی بدون اینکه:

- User یا Tenant را بازنویسی کنی
- Authorization را در چند نقطه تغییر دهی
- Commerce table را مستقیم query کنی
- REST و MCP را دوباره طراحی کنی
- Outbox یا Audit را کنار بگذاری

اگر برای این کارها مجبور به rewrite شدی، معماری را شکسته‌ای.

---

## ۱۱. قانون بدهی معماری

قبل از شروع هر فاز، Agent باید `10-architecture/debt/00-debt-audit.md` را بررسی کند. اگر P0 باز وجود دارد، ساخت feature جدید ممنوع است و باید `64-delivery/phase-4-architecture-debt/` اجرا شود.

وجود یک فایل sample یا migration به معنی implemented بودن قابلیت نیست. وضعیت artefact باید از `10-architecture/debt/01-status-of-artifacts.md` مشخص شود.

خروجی‌های اجباری Agent:

- `PHASE_PLAN.md` از `templates/PHASE_PLAN.md`
- `OPEN_QUESTION.md` در صورت ابهام
- `IMPLEMENTATION_REPORT.md` بعد از هر task
- ADR برای هر تغییر معماری

---

## ۱۲. الزام پایان فاز

Agent در پایان هر فاز باید یک فایل `NEXT_PHASE.md` بسازد که شامل عنوان فاز بعد، شرط شروع، دامنه، خارج از دامنه، خروجی، ریسک و معیار پذیرش باشد. بدون این فایل، phase gate ناقص است.
