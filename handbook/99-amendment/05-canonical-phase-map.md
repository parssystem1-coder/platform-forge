# نقشه فاز مرجع (تنها مرجع)

> این فایل هر سه نقشه قبلی را باطل می‌کند (F-023).
> `MASTER_AGENT_HANDOFF.md` بند ۵، `60-delivery/61-roadmap-phases.md` جدول ۶۱.۲، و نام پوشه‌ها از این پس فقط به این جدول ارجاع می‌دهند.

## تناقضی که بود

| فاز | طبق HANDOFF بند ۵ | طبق 61-roadmap | طبق پوشه‌های واقعی |
| --- | --- | --- | --- |
| ۳ | Workers + Notifications | Notifications + Workers | Reliability |
| ۴ | Features + Plans | Features و پلن | **Architecture Debt** |
| ۵ | Billing + Ledger | Billing + Ledger | **Commerce Implementation** |
| ۶ | Usage + Quota | Metering + Quota | **Features + Plans** |
| ۷ | Domains + Public API | Domains + Public API | **Billing + Ledger** |

سه مرجع یعنی هیچ مرجع. هر Agent جدیدی که این بسته را بخواند، فاز دیگری را «فاز جاری» می‌فهمد.

## نقشه مرجع

نام‌گذاری عمداً از شماره به نام تغییر کرد، چون شماره‌ها سه بار جابجا شده‌اند و دیگر قابل اعتماد نیستند.

| کلید | فاز | وضعیت واقعی امروز | شرط ورود |
| --- | --- | --- | --- |
| `P-FOUNDATION` | مخزن قابل اجرا، CI، compose، kernel | `SPEC` و `SKELETON` ناقص | — |
| `P-DEBT` | بستن D-001..D-008 و F-001..F-034 | **فاز جاری واقعی** | — |
| `P-IDENTITY` | Identity + Tenancy + AuthZ واقعی | `SPEC` کامل، کد صفر | Gate فاز P-DEBT |
| `P-COMMERCE` | محصول، فروشگاه، سبد، سفارش | `SPEC` دو بار! (F-026) | تست نشتی سبز |
| `P-RELIABILITY` | Worker، Notification، Outbox واقعی | `SPEC` + migration | یک سفارش واقعی ثبت شده باشد |
| `P-FEATURES` | Plan، PlanVersion، Feature Resolver | `SPEC` + migration | ۳ پلن واقعی با قیمت واقعی |
| `P-BILLING` | Subscription، Invoice، Payment، Ledger | `SPEC` + migration | درگاه انتخاب و حساب باز شده |
| `P-METERING` | Usage و Quota واقعی | `SPEC` | یک منبع واقعاً محدود |
| `P-PLATFORM-API` | Domain، API key، Webhook | `SPEC` | Commerce در تولید |
| `P-AI` | AI Gateway | `SPEC` | درخواست یک مشتری واقعی |
| `P-AUTOMATION` | جریان کار داخلی | `SPEC` | — |
| `P-MCP` | ابزار برای ایجنت | `SPEC` | API عمومی ۱ ماه پایدار |
| `P-DOMAINS+` | CRM، SEO، Accounting | `SPEC` | پروژه جداگانه |
| `P-ECOSYSTEM` | Plugin، Marketplace | `SPEC` | ۳ درخواست واقعی شخص ثالث |

## جمله مهمی که باید بپذیری

امروز در `P-DEBT` هستی، نه در فاز ۷. هفت مجموعه سند فاز تولید شده ولی هیچ کدی اجرا نشده. این بد نیست: اسنادت دارایی‌اند. اما شمارش فاز بر اساس سند، خودفریبی است.

## قانون جدید شمارش فاز

یک فاز وقتی تمام است که هر سه تای این موجود باشند:

```text
۱. سند      → قرارداد و معیار پذیرش
۲. کد       → در مخزن، قابل اجرا
۳. شاهد    → خروجی تست یا لاگ CI یا endpoint زنده
```

یکی از سه نباشد، فاز `SPEC` است نه تمام‌شده. همین.
