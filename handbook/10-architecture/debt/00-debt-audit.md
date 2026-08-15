> ⚠ اصلاحیه نسخه ۳: این ممیزی درست بود اما ناقص. ۳۴ یافته جدید، شامل ۹ حفره
> امنیتی که در D-001..D-022 نبودند، در `99-amendment/01-findings-register.md` ثبت شده‌اند.
> مهم‌ترین‌شان: `outbox_events` و `ledger_lines` هیچ RLS ندارند.

# ممیزی بدهی معماری نسبت به MASTER_AGENT_HANDOFF

## نتیجه کوتاه

بسته فعلی از نظر مستندات گسترده است، اما هنوز **قابل اجرا به‌عنوان محصول نیست**. بخش زیادی از آن contract و skeleton است، نه implementation. بنابراین بزرگ‌ترین بدهی الان «ساخت قابلیت جدید» نیست؛ **تبدیل قراردادها و نمونه‌ها به یک baseline قابل اجرا و enforce‌شده** است.

## سطح‌بندی

- **P0**: اگر حل نشود، ادعای معماری یا امنیت معتبر نیست.
- **P1**: قبل از Commerce production باید حل شود.
- **P2**: قبل از Billing/AI/Plugin لازم است.
- **P3**: بهینه‌سازی پس از traction.

---

## P0: بدهی‌های فوری

| ID | بدهی | شاهد | اثر | راه‌حل |
|---|---|---|---|---|
| D-001 | Skeleton هنوز اپ واقعی NestJS نیست | فقط `package.json` و چند sample file وجود دارد؛ `apps/api/src/main.ts` و module bootstrap نیست | Agent ممکن است فکر کند فاز ۰ ساخته شده | یک API واقعی با NestJS، DI، route و test بالا بیاور |
| D-002 | package scripts قابل اجرا نیستند | `verify` به workspace واقعی اشاره می‌کند اما workspace config و lockfile کامل نیست | CI/Local از صفر اجرا نمی‌شود | `pnpm-workspace.yaml`, `turbo.json`, packageهای واقعی و lockfile بساز |
| D-003 | migration role setup وجود ندارد | docs نقش‌ها را می‌گویند، SQL ساخت role و grants ندارد | RLS ممکن است در عمل دور زده شود | migration/bootstrap امن برای owner/app و تست role واقعی |
| D-004 | RLS سیاست INSERT/UPDATE کامل بررسی نشده | policyهای موجود عمدتاً `USING` دارند | write policy ممکن است با behavior مورد انتظار ناسازگار شود | policyهای `USING` و `WITH CHECK` جدا و تست‌شده |
| D-005 | Tenant Leak Suite به helperهای وجودنداشته وابسته است | `tests/tenant-leak.spec.ts` helper import می‌کند ولی helper implementation در skeleton نیست | تست امنیتی اجرا نمی‌شود | test harness واقعی با Postgres role app بساز |
| D-006 | Outbox publisher با schema و locking کامل هم‌خوان نیست | نمونه publisher event را claim می‌کند ولی lock/update strategy و dead-letter migration کامل یکپارچه نیست | duplicate یا stuck event | repository/worker واقعی با claim state یا lock صحیح و تست crash |
| D-007 | `MASTER_AGENT_HANDOFF` می‌گوید قبل از کد PLAN بساز، اما phase plan executable template ندارد | فقط دستور متنی است | Agentها خروجی‌های متفاوت می‌سازند | template اجباری `PHASE_PLAN.md` و `OPEN_QUESTION.md` اضافه کن |
| D-008 | OpenAPI و route implementation متصل نیستند | OpenAPI فایل هست، route contract test واقعی نیست | drift بین سند و کد | generated contract test و CI check واقعی |

---

## P1: قبل از Production Commerce

| ID | بدهی | اثر | راه‌حل |
|---|---|---|---|
| D-009 | API، Worker و Web boundary فقط در سند است | deploy artifact واقعی وجود ندارد | استقرار و scaling مبهم | سه app واقعی با build و health |
| D-010 | Customer session implementation ناقص است | storefront auth بدون کد اجرایی | دسترسی سفارش قابل ساخت نیست | customer session جدا با cookie و ownership tests |
| D-011 | Cart aggregate و checkout implementation وجود ندارد | Commerce فقط contract است | درآمد واقعی ممکن نیست | slices فاز ۲ را واقعاً پیاده کن |
| D-012 | Inventory reservation فقط SQL نمونه است | timeout/release و transaction behavior کامل نیست | oversell | integration concurrency tests |
| D-013 | Read Model projector فقط سند است | storefront projection rebuild واقعی نیست | فروشگاه stale/خالی | projector + replay + lag metric |
| D-014 | Notification template renderer و provider واقعی نیست | ایمیل‌ها قابل تحویل نیستند | تجربه و recovery ناقص | template schema + Mailpit + retry e2e |
| D-015 | Object Storage adapter و upload policy وجود ندارد | فایل و تصویر مسیر production ندارد | Product media بن‌بست می‌شود | S3 port + presigned upload + scan/limits |
| D-016 | domain mapping و custom domain operational layer ساخته نشده | storefront host resolution فقط طراحی است | multi-tenant public web کار نمی‌کند | tenant_domains table + cache + verification runbook |

---

## P2: قبل از Billing/AI/Extensions

| ID | بدهی | اثر | راه‌حل |
|---|---|---|---|
| D-017 | Plan/Subscription/Ledger migration اجرایی وجود ندارد | Billing فقط متن است | پول قابل اتکا نیست | schema + invariants + reconciliation |
| D-018 | Feature resolver از config به data migration مسیر ندارد | upgrade/downgrade واقعی نمی‌شود | feature gate شکننده | versioned effective entitlement model |
| D-019 | Quota commit برای actual quantity و failure semantics کامل تست نشده | credit leakage | concurrency/property tests |
| D-020 | API identity و scopes فقط contract است | machine client ناامن | API key/OAuth implementation |
| D-021 | AI Gateway و provider adapter واقعی نیست | AI مستقیم یا fake می‌شود | cost/control از دست می‌رود | gateway contract + fake provider + budget tests |
| D-022 | Plugin SDK و permission review فقط roadmap است | extension امن نیست | plugin boundary واقعی |

---

## P3: پس از traction

- Dedicated infrastructure orchestration
- Multi-region
- OpenSearch
- Kafka یا event broker خارجی
- Plugin sandbox سخت‌گیرانه
- Marketplace settlement و revenue share
- Advanced data warehouse

---

## بدهی‌های تناقضی داخل اسناد

| مورد | مشکل | تصمیم اصلاحی |
|---|---|---|
| `one_owner_per_tenant_guard_idx` | unique روی `(tenant_id, role)` فقط یک owner برای tenant را محدود می‌کند، اما برای نقش‌های دیگر هم اثر غیرضروری می‌تواند داشته باشد | partial unique با `role = 'owner' AND status = 'active'` در نسخه بعد بررسی و تست شود |
| Outbox at-least-once vs «دقیقاً یک بار» | بعضی متن‌ها عبارت دقیقاً یک بار را القا می‌کنند | فقط at-least-once + idempotent consumer ادعا شود |
| `withoutTenant` | escape hatch در sample وجود دارد | فقط برای جداول platform-wide با lint rule و review اجباری |
| Payment در Commerce MVP | port و fake است، نه پرداخت واقعی | در مستندات و UI با برچسب test/manual مشخص شود |
| Skeleton و implementation | وجود sample code با محصول ساخته‌شده اشتباه گرفته می‌شود | README باید status هر artefact را مشخص کند |

## حکم ممیزی

تا وقتی D-001 تا D-008 حل نشده‌اند، **فاز ویژگی جدید را شروع نکن**. اول debt closure، بعد ادامه Commerce/Notification.
