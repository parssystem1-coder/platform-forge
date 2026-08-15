# رجیستری کامل یافته‌ها

## شدت‌بندی

- **S0 امنیتی/فاجعه‌بار**: نشت داده بین مستاجر یا خطای مالی. قبل از هر کد جدید بسته می‌شود.
- **S1 مسدودکننده اجرا**: کد یا migration اجرا نمی‌شود.
- **S2 نقض قانون خودِ سند**: پروژه قانونی که نوشته را رعایت نکرده.
- **S3 حاکمیتی/ابهام**: باعث خروجی متفاوت Agent و drift می‌شود.
- **S4 بهبود**: باگ نیست، اما معماری با آن بهتر می‌شود.

## خلاصه آماری

| شدت | تعداد | وضعیت اصلاح |
| --- | --- | --- |
| S0 | ۹ | ✅ SQL اصلاحی ارائه شد |
| S1 | ۶ | ✅ کد اصلاحی ارائه شد |
| S2 | ۷ | ✅ اصلاح سند + قانون CI |
| S3 | ۶ | ✅ نقشه فاز واحد + حاکمیت |
| S4 | ۶ | ✅ ADR جدید |
| **جمع** | **۳۴** | **✅ همه اصلاح شده (2026-08-15)** |

---

## بخش A: امنیت و یکپارچگی داده (S0)

| ID | یافته | شاهد | اثر واقعی | اصلاح |
| --- | --- | --- | --- | --- |
| F-001 | `outbox_events` ستون `tenant_id` دارد اما هیچ RLS و POLICY ندارد | `30-data/ddl/0001_core.sql:138-155`؛ در آرایه جدول‌های `0003_rls_phase2.sql` هم نیست | payload کامل هر رخداد هر مستاجر با یک SELECT ساده از نقش app خوانده می‌شود: سفارش‌ها، ایمیل‌ها، داده هویتی | `0010_rls_hardening.sql` بخش ۱ |
| F-002 | `outbox_dead_letters` همان مشکل را دارد | `30-data/ddl/phase-3/0006_reliability.sql:3-19` | همان نشت، با payload شکست‌خورده که معمولاً حساس‌تر است | `0010` بخش ۱ |
| F-003 | تست نشتی خودِ پروژه با این دو جدول قرمز می‌شود | `90-skeleton/tests/tenant-leak.spec.ts` تست «هر جدول دارای tenant_id باید FORCE RLS داشته باشد» | یعنی این تست هرگز اجرا نشده. اگر شده بود از migration اول قرمز بود | با F-001 و F-002 خودکار بسته می‌شود |
| F-004 | `ledger_lines` نه `tenant_id` دارد نه RLS | `phase-7/0009_billing.sql:109-117` و آرایه RLS خط ۱۳۸ | خطوط مالی همه مستاجرها یکجا قابل خواندن. برای «مرجع حقیقت مالی» پذیرفتنی نیست | `0011_ledger_integrity.sql` |
| F-005 | `ledger_accounts` از آرایه RLS جا مانده در حالی که `tenant_id` دارد | `0009_billing.sql:86-94` و خط ۱۳۸ | ساختار حساب‌های مالی هر مستاجر افشا می‌شود | `0011` |
| F-006 | `WITH CHECK` در فازهای ۱ تا ۳ وجود ندارد، فقط `USING` | `0001_core.sql:163,168,173`؛ `0003_rls_phase2.sql:24`؛ `0006_reliability.sql:78,83` | `UPDATE ... SET tenant_id = '<other>'` موفق می‌شود: مهاجرت ردیف به مستاجر دیگر. INSERT با tenant_id غلط هم می‌گذرد. این همان D-004 است که باز مانده | `0010` بخش ۲ |
| F-007 | `audit_logs` با شرط `tenant_id IS NULL OR ...` و بدون `WITH CHECK` | `0001_core.sql:171-177` | نقش app می‌تواند رکورد audit جعلی برای هر مستاجر بنویسد یا با `tenant_id = NULL` رکوردی بسازد که همه ببینند. Audit نه append-only است نه tamper-resistant | `0010` بخش ۳: پالیسی جدا برای read و insert به‌همراه revoke |
| F-008 | `current_setting('app.tenant_id', true)::uuid` در برابر رشته خالی می‌ترکد | همه پالیسی‌ها | اگر جایی `set_config(..., '', true)` اجرا شود، به‌جای «صفر ردیف» خطای `invalid input syntax for type uuid` می‌گیری: مسیر امن به مسیر خطا تبدیل می‌شود | همه‌جا `nullif(current_setting('app.tenant_id', true), '')::uuid` |
| F-009 | `ledger_entries` کلید یگانه سراسری `UNIQUE (source_type, source_id)` دارد | `0009_billing.sql:104` | برخورد بین مستاجرها: اگر دو مستاجر source_id یکسان بسازند، ثبت مالی دومی رد می‌شود. باگ مالی خاموش | `0011`: `UNIQUE (tenant_id, source_type, source_id)` |

---

## بخش B: باگ‌های اجرایی کد (S1)

| ID | یافته | شاهد | اثر | اصلاح |
| --- | --- | --- | --- | --- |
| F-010 | `now() + interval 15` سینتکس نامعتبر PostgreSQL است | `kernel/quota-service.ts` ثابت `INSERT_RESERVATION` | «مهم‌ترین SQL پروژه» در اولین اجرا syntax error می‌دهد. باید `interval '15 minutes'` باشد | `quota-service.ts` اصلاح‌شده |
| F-011 | همان INSERT مقدار عددی `5` را در ستون `status` می‌گذارد | همان فایل | `status` با `CHECK (status IN ('pending','committed','released'))` تعریف شده (`0002_commerce.sql:116`). درج همیشه fail می‌شود | مقدار `'pending'` |
| F-012 | شمارش پارامترها در `INSERT_RESERVATION` غلط است | همان فایل، `$5` برای idempotency_key | حتی بعد از رفع دو مورد بالا، `expires_at` و `created_at` بدون placeholder می‌مانند | بازنویسی کامل statement |
| F-013 | `outbox-publisher` انتشار را داخل تراکنش claim انجام می‌دهد | `apps/worker/src/outbox-publisher.ts` متد `tick()` | یک consumer کند کل batch را قفل نگه می‌دارد؛ هر خطای DB کل batch را rollback می‌کند و رخدادهای منتشرشده «علامت‌نخورده» می‌مانند؛ و دقیقاً برعکس دستور خود پروژه در `64-delivery/phase-4-architecture-debt/03-execution-order.md` Step 6 است | بازنویسی با الگوی claim → commit → handle → mark |
| F-014 | `insert into outbox_dead_letters select *, now() from outbox_events` ستون‌ها را منطبق فرض می‌کند | همان فایل | schema این دو جدول یکسان نیست: `original_event_id`، `dead_lettered_at`، `replayed_at`، `replayed_by` در dead_letters هست و `available_at`، `published_at` نیست. این INSERT قطعاً fail می‌کند | INSERT صریح با نام ستون |
| F-015 | `authorization.ts` بعد از بررسی scope برای actor نوع machine متوقف نمی‌شود | `kernel/authorization.ts` متد `authorize` | machine client هیچ `userId` ندارد، پس در خط بعد `Forbidden` می‌خورد. یعنی هیچ API key هرگز مجاز نمی‌شود | `return` بعد از بررسی scope و feature |

---

## بخش C: نقض قوانین خودِ پروژه (S2)

| ID | یافته | شاهد | اثر | اصلاح |
| --- | --- | --- | --- | --- |
| F-016 | دو پیاده‌سازی موازی `withTenant` وجود دارد | `kernel/unit-of-work.ts` و `db/tenant-db.ts` | نقض «قانون طلایی ۱: مسیر واحد». یکی از این دو حتماً از قلم می‌افتد و همان یکی نشتی می‌دهد | `tenant-db.ts` حذف و تبدیل به re-export منسوخ |
| F-017 | worker از مسیر داخلی app دیگر import می‌کند | `outbox-publisher.ts`: `import type { Pool } from '../../api/src/kernel/unit-of-work'` | نقض «worker به API وابسته نیست، فقط package مشترک» در Step 2 فاز ۴. dependency-cruiser باید این را قرمز کند و نمی‌کند | انتقال type به `packages/contracts` |
| F-018 | فاز ۴ هیچ checkbox بسته‌شده‌ای ندارد، اما اسناد فاز ۵ و ۶ و ۷ تولید شده‌اند | `64-delivery/phase-4-architecture-debt/01-backlog.md` و `05-final-review.md` همه `[ ]`، در مقابل وجود `65/66/67-delivery/` | نقض صریح بند ۱۱ `MASTER_AGENT_HANDOFF`: «اگر P0 باز است، ساخت feature جدید ممنوع» | نقشه فاز واحد + قفل Gate در CI |
| F-019 | `05-completeness-check.md` همه‌چیز را `[x]` زده در حالی که `01-status-of-artifacts.md` همه‌چیز را `SPEC` می‌داند | مقایسه دو فایل | معیار «کامل» شده «سند وجود دارد». همان توهمی که خود پروژه در P3 دفتر ریسک هشدارش را داده | بازنویسی چک‌لیست با دو ستون `SPEC?` و `IMPLEMENTED?` |
| F-020 | کاتالوگ خطا ناقص است اما ۱۲ سند به کدهای غایب ارجاع می‌دهند | `70-contracts/errors.md` فقط ۲۴ کد دارد. `billing.feature_not_available` (402)، `billing.quota_exceeded` و تمام `commerce.*` غایب‌اند، در حالی که `authorization.ts` و `quota-service.ts` و `70-contracts/phase-5/commerce-runtime-contract.md` از آن‌ها استفاده می‌کنند | قانون ۱۳ خود پروژه از روز اول شکسته است | `errors.md` کامل بازنویسی شد |
| F-021 | `openapi.yaml` فقط ۹ مسیر فاز ۱ دارد | `70-contracts/openapi.yaml` | قراردادهای Commerce فقط در markdown هستند. یعنی drift که D-008 نگرانش بود از قبل وجود دارد | openapi تنها مرجع ماشین‌خوان؛ markdownها توضیحی |
| F-022 | `authorize()` سهمیه را با `assertAvailable` یعنی خواندن چک می‌کند | `authorization.ts` interface `QuotaChecker` | نقض «قانون ۷: رزرو و تسویه، نه بخوان بعد کم کن». یک race condition رسمی که به‌عنوان الگو ارائه شده | حذف quota از authorize، رزرو فقط در Use Case. ADR-0018 |

---

## بخش D: حاکمیت و ابهام (S3)

| ID | یافته | شاهد | اثر | اصلاح |
| --- | --- | --- | --- | --- |
| F-023 | سه نقشه فاز متناقض | `MASTER_AGENT_HANDOFF.md` بند ۵ فاز ۴ را Features+Plans می‌داند، `60-delivery/61-roadmap-phases.md` فاز ۳ را Notifications، و پوشه‌های واقعی فاز ۴ را Architecture Debt و ۵ را Commerce Impl | سه مرجع یعنی هیچ مرجع. Agent هر بار فاز دیگری را «جاری» می‌فهمد | `05-canonical-phase-map.md` تنها مرجع |
| F-024 | `README.md` هفت «فاز جاری» مختلف اعلام می‌کند | بخش‌های تکراری «فاز جاری» برای فازهای ۱ تا ۷ | دستور خود README («فاز جاری را از README تشخیص بده») غیرقابل اجراست | بلوک وضعیت واحد در بالای README |
| F-025 | هشت پوشه هم‌سطح با نام delivery | `60-` تا `67-delivery/` | شماره‌گذاری معنایش را از دست داده؛ `60-delivery` هم اسناد عمومی دارد هم فاز ۱ | ساختار واحد `60-delivery/phase-N-*/` |
| F-026 | دامنه Commerce دو بار spec شده | `62-delivery/phase-2-commerce-mvp/` و `65-delivery/phase-5-commerce-implementation/` | دو منبع حقیقت برای یک دامنه؛ تناقض آینده تضمین‌شده | ادغام: یکی scope، یکی execution |
| F-027 | `withoutTenant` هیچ اجبار فنی ندارد | `unit-of-work.ts` | خود دفتر بدهی گفته «فقط با lint rule و review اجباری»، اما هیچ rule نوشته نشده | rule صریح در `.dependency-cruiser.cjs` + allowlist جدول |
| F-028 | تولید `orders.number` تعریف نشده | `0002_commerce.sql:63-77` با `UNIQUE (tenant_id, number)` | تحت بار همزمان، تولید شماره در اپلیکیشن یعنی برخورد یگانگی و سفارش شکست‌خورده در لحظه پرداخت | sequence per-tenant یا advisory lock. ADR-0020 |

---

## بخش E: بهبود معماری (S4)

| ID | یافته | چرا مهم است | اصلاح |
| --- | --- | --- | --- |
| F-029 | `authorize()` برای `kind: 'customer'` همیشه Forbidden می‌دهد | هیچ مسیر مجازی برای خریدار فروشگاه وجود ندارد، پس Storefront ناچار است `authorize` را دور بزند؛ دقیقاً در پرترافیک‌ترین مسیر سیستم | `authorizeCustomer()` مبتنی بر ownership در همان ماژول. ADR-0016 |
| F-030 | `kind: 'staff'` هیچ مسیری ندارد | Platform Staff عضویت ندارد، پس در lookup رد می‌شود. یعنی Platform Admin realm که ستون مدل هویت است، غیرقابل پیاده‌سازی است | مسیر staff با permission سراسری و audit اجباری impersonation. ADR-0016 |
| F-031 | دفتر مالی هیچ اجبار توازن بدهکار و بستانکار ندارد | «دفتر دوطرفه» بدون constraint توازن، فقط یک جدول است | trigger توازن deferrable در `0011`. ADR-0017 |
| F-032 | جدول‌های مالی و audit فقط با convention غیرقابل تغییرند | «اصلاح مالی با reversing entry است» اما `GRANT ... UPDATE, DELETE ON ALL TABLES` به نقش app داده شده | `REVOKE UPDATE, DELETE` روی جدول‌های append-only در `0000_bootstrap_roles.sql` |
| F-033 | پالیسی RLS جدول `tenants` مسئله مرغ و تخم‌مرغ دارد | پالیسی `id = app.tenant_id` است. در ثبت‌نام هنوز tenant context وجود ندارد پس ساخت tenant غیرممکن است، و کاربر هرگز نمی‌تواند فهرست tenantهایش را بگیرد | خواندن از مسیر `memberships` با پالیسی `EXISTS` و ساخت در تراکنش platform-scope. ADR-0015 |
 F-034 | ارجاع حلقه‌ای `sessions` و `session_refresh_tokens` غیر deferrable است | `0001_core.sql:117-121`؛ درج اولین نشست و توکن در یک تراکنش نیازمند ترتیب دقیق است؛ هر بازآرایی کد FK را نقض می‌کند | `DEFERRABLE INITIALLY DEFERRED` در `0010` |

---

## یافته‌هایی که بررسی شد و مشکلی نداشت

برای اینکه بدانی چه چیزهایی عمداً رد نشده‌اند:

- `inventory_items` با `CHECK (reserved <= on_hand)` در سطح جدول: درست و دقیقاً همان چیزی که جلوی oversell را می‌گیرد.
- `price_minor bigint` و `amount_minor bigint`: پول صحیح، بدون float. مطابق قانون خودتان.
- `citext` برای email و slug با یگانگی tenant-scoped: درست.
- `order_lines.title_snapshot` و `unit_price_minor`: snapshot سفارش درست مدل شده؛ تغییر قیمت محصول سفارش قدیمی را عوض نمی‌کند.
- `idx_outbox_pending` به‌صورت partial index: دقیقاً الگوی درست برای صف.
- `session_refresh_tokens` با `family_id`، `parent_token_id` و `replaced_by_token_id`: مدل rotation و reuse detection کامل و درست است.
- `mfa_totp_factors.secret_ciphertext` با `secret_key_version`: چرخش کلید از روز اول در نظر گرفته شده. نادر و درست.
