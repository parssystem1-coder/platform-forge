> # ⚠ وضعیت رسمی پروژه
>
> **فاز جاری: `P-DEBT` (بستن بدهی معماری و امنیت).**
>
> این تنها اعلام وضعیت معتبر در کل مخزن است. اسناد فاز ۱ تا ۷ در پوشه‌های
> `6X-delivery/` **قرارداد** هستند، نه گزارش ساخت. هیچ artefactی امروز
> وضعیت `IMPLEMENTED` ندارد.
>
> قبل از هر کاری این سه فایل را بخوان:
>
> 1. `99-amendment/02-critical-security-fixes.md` — ۹ حفره امنیتی باز
> 2. `99-amendment/05-canonical-phase-map.md` — نقشه فاز مرجع
> 3. `99-amendment/07-execution-plan.md` — کاری که فردا انجام می‌دهی
>
> نقشه فاز `MASTER_AGENT_HANDOFF` بند ۵ و جدول `61-roadmap-phases.md`
> **باطل** شده‌اند و با هم تناقض داشتند (یافته F-023).

# PLATFORM ARCHITECTURE AND DELIVERY HANDBOOK

## پلتفرم SaaS چندمستاجری، ماژولار و API-first با Commerce به‌عنوان اولین دامنه

نسخه: ۲.۰ (ادغام‌شده و کامل)

این بسته جایگزین هر دو سند قبلی است. همه‌ی جزئیات فاز اول از بسته‌ی قدیمی داخلش هست، به‌علاوه‌ی تمام لایه‌هایی که در نسخه‌ی قبل غایب بودند: مسیر داده‌ی فروشگاه، هویت خریدار، دفتر مالی، سهمیه‌ی اتمیک، فرانت‌اند و عملیات.

---

## این بسته چه هست و چه نیست

هست: قرارداد مهندسی. هر سند معیار پذیرش دارد و قابل تبدیل به تست است.

نیست: لیست آرزو. هرچه امروز لازم نیست، عمداً به فاز بعد رانده شده و شرط ورودش نوشته شده.

> اصل حاکم: امروز مرزها و قراردادها را بساز. قابلیت‌ها را وقتی بساز که مشتری واقعی پولش را می‌دهد.

---

## از کجا شروع کنم

### اگر می‌خواهی امروز کد بزنی

1. `AGENT_BRIEF.md`
2. `60-delivery/62-phase-1-execution-plan.md`
3. `10-architecture/12-layering-and-dependency-rules.md`
4. `10-architecture/15-multitenancy-and-isolation.md`
5. `30-data/ddl/0001_core.sql`
6. `90-skeleton/`

### اگر می‌خواهی اول تصمیم بگیری

1. `00-executive/01-product-definition.md`
2. `00-executive/03-what-changed-and-why.md`
3. `00-executive/02-architecture-decisions-summary.md`
4. `60-delivery/61-roadmap-phases.md`
5. `60-delivery/65-risk-register.md`

---

## فهرست کامل

### 00-executive
| فایل | محتوا |
|------|--------|
| 01-product-definition.md | محصول، چهار نوع کاربر، مفاهیم، اهداف عددی |
| 02-architecture-decisions-summary.md | جدول ۱۵ تصمیم و شرط بازبینی |
| 03-what-changed-and-why.md | تفاوت با نسخه اول و دلیل هر تغییر |

### 10-architecture
| فایل | محتوا |
|------|--------|
| 11-system-overview.md | Control Plane در مقابل Data Plane، نمودار کلی |
| 12-layering-and-dependency-rules.md | قوانین غیرقابل مذاکره و اجبار در CI |
| 13-module-catalog.md | هر ماژول، قراردادش و فازش |
| 14-identity-realms.md | چرا خریدار و کاربر هرگز یکی نمی‌شوند |
| 15-multitenancy-and-isolation.md | چهار لایه دفاع و RLS |
| 16-access-control.md | تابع واحد authorize و تفاوت 402 و 403 |
| 17-billing-and-ledger.md | پلن، اشتراک، تنزل امن، دفتر دوطرفه |
| 18-quota-and-metering.md | رزرو اتمیک و اندازه‌گیری مصرف |
| 19-events-and-outbox.md | Outbox، ترتیب، خطا، نگهداری |
| 20-storefront-data-plane.md | Read Model، کش، رزرو موجودی، بودجه |
| 21-api-platform.md | قرارداد REST و اندپوینت‌ها |
| 22-ai-and-extensibility.md | AI Gateway، MCP، اتوماسیون، افزونه |

### 30-data
| فایل | محتوا |
|------|--------|
| 31-data-model-core.md | مدل داده هویت، نشست، تنانسی، Audit، Outbox |
| 32-migration-and-lifecycle.md | الگوی دومرحله‌ای، عملیات خطرناک، نگهداری، پشتیبان |
| ddl/0001_core.sql | مهاجرت فاز ۱، قابل اجرا |
| ddl/0002_commerce.sql | مهاجرت فاز ۲، قابل اجرا |
| ddl/0003_rls_phase2.sql | سیاست RLS فاز ۲ به صورت خودکار |

### 40-engineering
| فایل | محتوا |
|------|--------|
| 41-coding-standards.md | نام‌گذاری، Controller، Use Case، خطا، تراکنش |
| 42-testing-strategy.md | پنج لایه تست و سوییت نشتی |
| 43-local-dev-setup.md | راه‌اندازی محلی قدم به قدم |
| 44-ci-cd.md | پایپ‌لاین و سیاست مهاجرت |
| 45-observability.md | لاگ، متریک، ردگیری، health |
| 46-security.md | مدل تهدید، رمز، نشست، MFA، محدودیت نرخ |
| 47-tech-stack.md | استک و دلیل هر انتخاب |
| 48-performance-budgets.md | اعداد قطعی برای API، فروشگاه، دیتابیس |
| 49-runbook.md | رانبوک ساعت ۳ بامداد |

### 50-frontend
| فایل | محتوا |
|------|--------|
| 51-frontend-architecture.md | چهار سطح، مدیریت توکن، نگاشت خطا به UI |
| 52-design-system.md | توکن، مولفه، دسترس‌پذیری، RTL |

### 60-delivery
| فایل | محتوا |
|------|--------|
| 61-roadmap-phases.md | ۱۳ فاز با شرط ورود و تخمین |
| 62-phase-1-execution-plan.md | دقیقاً از کجا شروع کنی |
| 63-definition-of-done.md | چک‌لیست پذیرش فاز ۱ |
| 64-team-process.md | کامیت، PR، ریویو، شاخه‌بندی |
| 65-risk-register.md | ۱۵ ریسک با پاسخ معماری |

### 70-contracts
| فایل | محتوا |
|------|--------|
| openapi.yaml | قرارداد ماشین‌خوان API |
| errors.md | کاتالوگ خطا با کد وضعیت |
| events.md | کاتالوگ رخداد و پاکت |
| permissions.md | رجیستری دسترسی و ماتریس نقش |
| features-and-quotas.md | کاتالوگ قابلیت و سقف و ماتریس پلن |

### 80-adr
۱۴ تصمیم معماری، هر یک با زمینه، تصمیم، پیامد منفی و شرط بازبینی.

### 90-skeleton
فایل‌های واقعی قابل کپی به مخزن:

| فایل | چرا مهم است |
|------|-------------|
| `docker-compose.yml` | Postgres و Redis و Mailpit |
| `.env.example` | تمام کلیدهای لازم |
| `.dependency-cruiser.cjs` | مرزهای معماری را اجبار می‌کند |
| `.github/workflows/verify.yml` | پایپ‌لاین کامل با دیتابیس واقعی |
| `apps/api/src/kernel/unit-of-work.ts` | تنها راه مجاز دسترسی به داده‌ی مستاجر |
| `apps/api/src/kernel/authorization.ts` | تابع واحد تصمیم دسترسی |
| `apps/api/src/kernel/quota-service.ts` | رزرو اتمیک، مهم‌ترین SQL پروژه |
| `apps/worker/src/outbox-publisher.ts` | انتشار رخداد با skip locked و backoff |
| `tests/tenant-leak.spec.ts` | مهم‌ترین سوییت تست |

---

## ۱۰ قانون طلایی

1. مسیر واحد تصمیم دسترسی. هر عملیات از یک تابع authorize عبور می‌کند.
2. مرز مستاجر چهار لایه دارد. RLS آخرین خط دفاع است، نه تنها خط دفاع.
3. خریدار فروشگاه و کاربر پلتفرم دو موجود جدا و هرگز یکی نمی‌شوند.
4. Interface نازک است. REST و MCP و Webhook و Plugin همه به Application Service می‌رسند.
5. هر نوشتن مهم در همان تراکنش Outbox دارد. انتشار مستقیم ممنوع.
6. پول دفتر دوطرفه دارد، از روز اول.
7. سقف مصرف اتمیک است. رزرو و تسویه، نه بخوان بعد کم کن.
8. تنزل پلن داده حذف نمی‌کند.
9. هیچ چیز بدون معیار پذیرش ساخته نمی‌شود.
10. Future-ready یعنی قرارداد آماده، نه کد آماده.

---

## ترتیب پیشنهادی کار از امروز

۱. `AGENT_BRIEF.md` را در یک Session تازه به ایجنت کدنویس بده.
۲. از او بخواه اول `PLAN.md` و لیست سؤالات باز را بدهد، نه کد.
۳. قدم ۱ تا ۳ فاز ۱ را تمام کن و تست نشتی مستاجر را سبز کن.
۴. بعد از آن برش ثبت‌نام تا ورود را کامل کن.
۵. قبل از فاز ۲، `63-definition-of-done.md` را خط به خط چک کن.

## نقشه‌های جدید اضافه‌شده در نسخه ۲.۱

- `00-executive/04-one-page-map.md`: نقشه یک‌صفحه‌ای کل سیستم
- `20-product/01-platform-scenario.md`: سناریوی محصول از ثبت‌نام تا سفارش و AI
- `20-product/02-capability-map.md`: نقشه قابلیت‌ها و وابستگی‌ها
- `10-architecture/23-end-to-end-map.md`: مسیر دقیق درخواست تا پاسخ
- `60-delivery/66-traceability-matrix.md`: ردیابی نیاز تا تست
- `60-delivery/67-phase-gates.md`: دروازه عبور از هر فاز
- `diagrams/`: نسخه‌های Mermaid برای قرار دادن در GitHub، Notion یا Docs

## بسته اجرایی فاز بعد

برای شروع اجرای واقعی، این فایل‌ها را بخوان:

- `00-executive/05-completeness-check.md`
- `20-product/01-platform-scenario.md`
- `20-product/02-capability-map.md`
- `20-product/03-domain-glossary.md`
- `60-delivery/68-phase-1-backlog.md`
- `60-delivery/69-implementation-handoff.md`
- `60-delivery/66-traceability-matrix.md`
- `60-delivery/67-phase-gates.md`

این نسخه فقط یک نقشه کلی نیست؛ برای هر بخش، مسیر، وابستگی، تسک، معیار اتمام و مسیر دمو دارد.

## (سند فاز) Foundation

برای اجرای زیربنا، از این پوشه شروع کن:

`60-delivery/phase-0-foundation/`

و برای فهم محصول از صفر تا پنج سال بعد:

- `00-executive/06-platform-explanation.md`
- `00-executive/07-roadmap-from-zero-to-platform.md`
- `00-executive/05-completeness-check.md`

این بسته اکنون هم نقشه محصول دارد، هم معماری، هم قرارداد، هم backlog، هم phase gate و هم skeleton اجرایی.

## (سند فاز) Phase 1 Identity + Tenancy + Authorization

اسناد اجرایی این فاز در:

- `61-delivery/phase-1-identity-tenancy/`
- `10-architecture/phase-1/`
- `30-data/ddl/phase-1/`
- `70-contracts/phase-1/`

ترتیب اجرا: Overview → Backlog → Database → Kernel → Registration → Sessions → Authorization → Gate.

## (سند فاز) Phase 2 Commerce MVP

اسناد این فاز در:

- `MASTER_AGENT_HANDOFF.md`
- `62-delivery/phase-2-commerce-mvp/`
- `10-architecture/phase-2/`
- `30-data/ddl/phase-2/`
- `70-contracts/phase-2/`

Agent باید ابتدا `MASTER_AGENT_HANDOFF.md` و سپس `62-delivery/phase-2-commerce-mvp/00-overview.md` را بخواند.

## (سند فاز) Phase 3 Reliability + Notifications

اسناد این فاز در:

- `63-delivery/phase-3-reliability/`
- `10-architecture/phase-3/`
- `30-data/ddl/phase-3/`
- `70-contracts/phase-3/`

Master Agent برای این فاز همچنان `MASTER_AGENT_HANDOFF.md` است.

## ممیزی بدهی معماری

قبل از هر فاز جدید، `10-architecture/debt/00-debt-audit.md` را بخوان. وضعیت فعلی artefactها در `10-architecture/debt/01-status-of-artifacts.md` است.

فاز بعدی اجباری: `64-delivery/phase-4-architecture-debt/`. این فاز D-001 تا D-008 را می‌بندد تا سند MASTER_AGENT_HANDOFF واقعاً قابل اجرا باشد، نه فقط قابل خواندن.

## قانون جدید تحویل فازها

در پایان هر فاز، علاوه بر فایل‌های فنی، باید `60-delivery/70-next-phase-plan.md` یا نسخه به‌روز آن وجود داشته باشد و دقیقاً بگوید فاز بعد چیست، شرط شروعش چیست و چه خروجی می‌دهد.

فاز فعلی: `64-delivery/phase-4-architecture-debt/`.
فاز بعد از آن: `Commerce MVP Implementation`، فقط بعد از PASS شدن P0 debt closure.

## (سند فاز) Phase 5 Commerce MVP Implementation

- `MASTER_AGENT_HANDOFF.md`
- `65-delivery/phase-5-commerce-implementation/`
- `10-architecture/phase-5/`
- `30-data/ddl/phase-5/`
- `70-contracts/phase-5/`

فاز بعد از Commerce در `65-delivery/phase-5-commerce-implementation/05-next-phase.md` ثبت شده است.

## (سند فاز) Phase 6 Features + Plans

- `66-delivery/phase-6-features-plans/`
- `10-architecture/phase-6/`
- `30-data/ddl/phase-6/`
- `70-contracts/phase-6/`

فاز بعد در `66-delivery/phase-6-features-plans/04-next-phase.md` ثبت شده است.

## (سند فاز) Phase 7 Billing + Subscription + Ledger

- `67-delivery/phase-7-billing-ledger/`
- `10-architecture/phase-7/`
- `30-data/ddl/phase-7/`
- `70-contracts/phase-7/`

فاز بعد در `67-delivery/phase-7-billing-ledger/05-next-phase.md` ثبت شده است.


---

## سند اصلاحیه نسخه ۳ (2026-08-15)

یک ممیزی کامل فایل‌به‌فایل روی این بسته انجام شد. نتیجه: **۳۴ یافته**،
شامل ۹ حفره امنیتی سطح S0 در migrationها و ۶ باگ که باعث می‌شد کدهای
نمونه هرگز اجرا نشوند.

همه‌چیز در `99-amendment/` است. شروع از `99-amendment/00-INDEX.md`.

| موضوع | فایل |
|---|---|
| رجیستری کامل ۳۴ یافته | `99-amendment/01-findings-register.md` |
| ۹ اصلاح امنیتی P0 | `99-amendment/02-critical-security-fixes.md` |
| باگ‌های کد skeleton | `99-amendment/03-code-defects.md` |
| ۷ تغییر معماری پیشنهادی | `99-amendment/04-architecture-improvements.md` |
| نقشه فاز مرجع | `99-amendment/05-canonical-phase-map.md` |
| برنامه ۲۶ تسکی | `99-amendment/07-execution-plan.md` |
| Gate واقعی با شاهد | `99-amendment/08-acceptance-gate.md` |
| وضعیت واقعی artefactها | `99-amendment/10-status-of-artifacts-corrected.md` |
| آنچه درست است و دست نخورد | `99-amendment/11-kept-as-is.md` |

### migrationهای اصلاحی

```text
30-data/ddl/amendment/0000_bootstrap_roles.sql
30-data/ddl/amendment/0010_rls_hardening.sql
30-data/ddl/amendment/0011_ledger_integrity.sql
30-data/ddl/amendment/0012_outbox_hardening.sql
```

### ADRهای جدید

`80-adr/0015` تا `80-adr/0021`.
