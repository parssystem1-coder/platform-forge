# ۱۱. نمای کلی سیستم

## ۱۱.۱ دو صفحه‌ی متفاوت که اکثراً قاطی می‌شوند

این مهم‌ترین تفکیک معماری این محصول است:

| | Control Plane | Data Plane |
| --- | --------------- | ------------ |
| کاربر | صاحب کسب‌وکار و کارمندان | خریدار نهایی |
| مسیر | پنل ادمین، API مدیریت | فروشگاه عمومی، سبد، پرداخت |
| الگوی ترافیک | کم‌حجم، نوشتن‌محور | پرحجم، خواندن‌محور |
| حساسیت | صحت و امنیت | تأخیر و دسترس‌پذیری |
| استراتژی | تراکنش قوی، RLS، Audit | Read Model، CDN، Cache، ISR |
| مقیاس | عمودی کافی است | افقی و لبه‌محور |

> اگر هر دو را با یک الگو بسازی، یا پنل را بیهوده کش می‌کنی یا فروشگاه را بیهوده کند.

---

## ۱۱.۲ نمودار کلی

```text
                          INTERNET
                              |
     +------------------+-----+------+------------------+
     |                  |            |                  |
  SHOPPERS         TENANT USERS   DEVELOPERS        AI AGENTS
     |                  |            |                  |
     v                  v            v                  v
  STOREFRONT        ADMIN PANEL   REST API           MCP*
  (Next.js SSR/ISR) (Next.js SPA) /api/v1
     |                  |            |                  |
     +--------+---------+------------+---------+--------+
              |                                |
         EDGE / CDN                       API GATEWAY
         cache, WAF                  auth, rate limit, ctx
              |                                |
              +----------------+---------------+
                               |
                    +----------v----------+
                    |  APPLICATION LAYER  |
                    |  (Use Cases only)   |
                    +----------+----------+
                               |
     +-------------------------+-------------------------+
     |                         |                         |
 PLATFORM CORE           DOMAIN MODULES            EXTENSION LAYER
 Identity                Commerce                  Webhooks
 Tenancy                 (Catalog, Order,          Plugins*
 Access Control           Inventory, Customer)     Automation*
 Billing + Ledger        CRM* / SEO* / ...         AI Gateway*
 Metering + Quota
 Notifications
 Audit
     |                         |                         |
     +-------------------------+-------------------------+
                               |
                        DOMAIN EVENTS
                               |
                       OUTBOX (same tx)
                               |
                      +--------v--------+
                      |    WORKERS      |
                      | publish, jobs,  |
                      | projections     |
                      +--------+--------+
                               |
     +-------------------------+-------------------------+
     |               |                    |             |
 PostgreSQL       Redis            Object Storage    Read Model
 + RLS          cache/lock/         images/docs      (catalog
 + pgvector*    queue/quota                          projection)

* = فاز بعدی
```

---

## ۱۱.۳ مسیر هر درخواست مدیریتی

```text
HTTP Request
  -> requestId + correlationId
  -> authenticate (session or API credential)
  -> resolve tenant context
  -> validate membership + tenant status
  -> authorize(actor, action, resource)      <- تنها نقطه تصمیم
  -> application use case
  -> withTenant(tenantId) transaction
       -> domain rules
       -> repository writes
       -> outbox append
       -> audit append
  -> commit
  -> response mapping
```

هیچ مسیر میان‌بری مجاز نیست. اگر جایی لازم شد مسیر دور زده شود، یعنی طراحی مشکل دارد.

---

## ۱۱.۴ مسیر هر درخواست فروشگاهی

```text
Shopper Request (myshop.com/products/x)
  -> CDN edge
       cache hit  -> پاسخ فوری
       cache miss -> Next.js render
                       -> Read Model query (denormalized)
                       -> بدون join سنگین، بدون تصمیم دسترسی پیچیده
  -> پاسخ + تعیین سرمعنوان cache
```

نوشتن در فروشگاه (سبد، سفارش) از مسیر تراکنشی عبور می‌کند، نه Read Model.

---

## ۱۱.۵ تصمیم استقرار

سه پروسه قابل استقرار:

| پروسه | مسئولیت | مقیاس‌پذیری |
| ------- | ---------- | -------------- |
| `api` | HTTP، تمام Use Case ها | افقی، stateless |
| `worker` | Outbox publisher، job ها، projection | افقی، بر اساس طول صف |
| `web` | Next.js: فروشگاه + پنل | افقی، لبه‌محور |

همه از یک مخزن کد (monorepo) می‌آیند. این Microservice نیست، فقط تفکیک چرخه‌ی عمر پروسه است.

**چرا worker از اول جداست؟** چون اگر Outbox publisher در پروسه API باشد، هر دیپلوی پردازش رخداد را قطع می‌کند و تأخیر قابل پیش‌بینی نخواهد بود.

---

## ۱۱.۶ مرزهای هسته که هرگز نمی‌شکنند

1. Commerce هرگز Identity یا Billing را از نو نمی‌سازد.
2. هیچ دامنه‌ای جدول دامنه دیگر را query نمی‌کند.
3. Read Model هرگز مرجع حقیقت نیست.
4. Storefront هرگز مستقیم به جدول عملیاتی نمی‌رسد.
5. Worker هرگز منطق کسب‌وکار مستقل ندارد؛ فقط Use Case را صدا می‌زند.
