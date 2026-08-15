# توضیح کامل پلتفرم به زبان ساده

## این محصول چه مشکلی را حل می‌کند؟

به‌جای اینکه برای هر کسب‌وکار یک نرم‌افزار جدا بسازیم، یک هسته SaaS می‌سازیم که هر کسب‌وکار بتواند داخل آن فضای مستقل خودش را داشته باشد. هر فضای مستقل Tenant است.

یک Tenant می‌تواند فروشگاه داشته باشد، اعضای تیم اضافه کند، دامنه متصل کند، محصولات و سفارش‌ها را مدیریت کند و بر اساس پلن خود قابلیت‌های بیشتری بگیرد.

## پلتفرم چه چیزی نیست؟

فقط E-Commerce نیست. Commerce اولین مشتری معماری است. همان هسته باید بتواند بعداً CRM، SEO، Accounting، Support، Analytics، Automation و AI را سرو کند.

## ستون‌های اصلی

```text
User       = انسان
Tenant     = کسب‌وکار
Membership = رابطه انسان و کسب‌وکار
Permission = اجازه انجام کار
Feature    = قابلیت خریداری‌شده برای Tenant
Quota      = سقف مصرف
Domain     = منطق واقعی مثل Commerce
Application Service = ورودی رسمی به عملیات کسب‌وکار
```

## یک مثال کامل

سعید ثبت‌نام می‌کند. سیستم یک User، یک Tenant به نام MyShop و یک Membership با نقش Owner می‌سازد. بعد از تأیید ایمیل، وارد پنل می‌شود. محصول ایجاد می‌کند. محصول در دیتابیس عملیاتی ذخیره می‌شود و event آن به Read Model فروشگاه می‌رود. مشتری نهایی محصول را می‌بیند، وارد checkout می‌شود، موجودی رزرو می‌شود، سفارش ساخته می‌شود و پرداخت از طریق provider انجام می‌شود. webhook پرداخت idempotent پردازش می‌شود. نتیجه در Ledger، Audit، Usage و Notification ثبت می‌شود.

## چرا این معماری قابل توسعه است؟

چون هر قابلیت جدید باید همان مسیر ثابت را مصرف کند:

```text
Interface
 -> Application Service
 -> Domain
 -> Repository
 -> Database
 -> Outbox
 -> Worker / Read Model / Integration
```

CRM یا SEO اجازه ندارد مستقیم جدول Commerce را بخواند. Plugin اجازه ندارد مستقیم دیتابیس را باز کند. AI اجازه ندارد مستقیم query بزند. همه از Application Service و Authorization عبور می‌کنند.

## فرق پنل و فروشگاه

پنل برای صحت، امنیت و عملیات مدیریتی است. فروشگاه برای سرعت، SEO و حجم بالای خواندن است. به همین دلیل پنل از API تراکنشی و RLS استفاده می‌کند، ولی storefront از Read Model، CDN و ISR.

## امنیت چگونه کار می‌کند؟

هر درخواست باید بداند actor کیست، در کدام Tenant است، Membership دارد یا نه، Permission دارد یا نه، Feature فعال است یا نه و Quota باقی مانده یا نه. دیتابیس هم با RLS دوباره tenant را محدود می‌کند. بنابراین یک اشتباه application نباید به نشت داده منجر شود.

## پول چگونه کار می‌کند؟

Plan و Subscription شرایط فروش را مشخص می‌کنند. Payment provider پول را جابه‌جا می‌کند. Ledger دوطرفه توضیح می‌دهد پول از کجا آمده و به کجا رفته. Webhook فقط یک بار اثر می‌گذارد و reconciliation مغایرت‌ها را پیدا می‌کند.

## پنج سال بعد چه شکلی است؟

```text
Platform Core
  -> Identity / Tenancy / Access / Billing / Usage / Audit

Domain Platform
  -> Commerce / CRM / SEO / Accounting / Support / Analytics

Extension Platform
  -> Public API / Webhooks / AI / MCP / Automation / Plugins / Marketplace

Infrastructure
  -> PostgreSQL / Redis / Object Storage / CDN / Workers
```

هسته ثابت می‌ماند؛ دامنه‌ها و extensionها اضافه می‌شوند.
