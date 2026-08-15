# نقشه یک‌صفحه‌ای کل پروژه

```text
                         INTERNET
                             |
       +---------------------+----------------------+
       |                     |                      |
   PLATFORM USERS        SHOPPERS              MACHINES
       |                     |                      |
       v                     v                      v
   ADMIN PANEL           STOREFRONT             REST / MCP
       |                     |                      |
       +----------+----------+----------+-----------+
                  v
             ACCESS EDGE
      AuthN, Rate Limit, Context
                  |
                  v
          APPLICATION SERVICES
                  |
    +-------------+-------------+
    |                           |
 PLATFORM CORE              DOMAIN MODULES
 Identity                    Commerce
 Tenancy                     CRM
 Authorization               SEO
 Billing + Ledger            Accounting
 Quota + Usage               Support
 Audit                       Analytics
 Notifications
                  |
                  v
             DOMAIN EVENTS
                  |
                OUTBOX
                  |
       +----------+----------+
       |          |          |
   WORKERS   READ MODEL   INTEGRATIONS
       |          |          |
 PostgreSQL   Redis/CDN   AI/API/Plugin
       |
 RLS + pgvector + Ledger
```

## جمله‌ای که کل محصول را توضیح می‌دهد

> این پلتفرم یک هسته‌ی امن برای هویت، Tenant، دسترسی، پول، مصرف و رخداد است؛ Commerce اولین مصرف‌کننده‌ی این هسته است و هر Domain یا Extension بعدی باید همان قراردادها را مصرف کند.

## انتهای مسیر پنج‌ساله

```text
Customer registers
 -> Tenant created
 -> Plan selected
 -> Domain connected
 -> Store launched
 -> Product created
 -> Shopper orders
 -> Payment reconciled
 -> Usage metered
 -> AI assists
 -> Automation runs
 -> CRM/SEO enabled
 -> Plugin installed
 -> Enterprise isolated
```

هر فلش باید از طریق یک Use Case، یک قرارداد، یک رخداد و یک تست قابل توضیح باشد.
