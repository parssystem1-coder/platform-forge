# ۱. تعریف محصول

## ۱.۱ محصول چیست

یک پلتفرم SaaS چندمستاجری، ماژولار، API-first و قابل توسعه که اولین دامنه کسب‌وکار آن Commerce است.

تفاوت مهم با یک فروشگاه‌ساز:

| فروشگاه‌ساز | این پلتفرم |
| ------------- | ------------ |
| Commerce هویت سیستم است | Commerce اولین ماژول است |
| Identity بخشی از Commerce است | Identity بخشی از Core است |
| افزودن CRM یعنی بازنویسی | افزودن CRM یعنی یک ماژول جدید |
| پلن‌ها در کد hardcode | پلن‌ها داده هستند |

---

## ۱.۲ ساختار مفهومی

```text
                        SaaS PLATFORM
                              |
     +------------------------+------------------------+
     |                        |                        |
PLATFORM CORE           DOMAIN MODULES          EXTENSION LAYER
     |                        |                        |
 Identity                Commerce                 Public API
 Tenancy                  CRM*                    Webhooks
 Access Control           SEO*                    Plugins*
 Billing & Ledger         Accounting*             MCP / Agents*
 Metering & Quota         Support*                Automation*
 Notifications            Analytics*              Marketplace*
 Audit
 Observability

* = فازهای بعدی. معماری آماده، پیاده‌سازی نه.
```

---

## ۱.۳ سفر مشتری که همان سفر پول است

```text
بازدید سایت اصلی
      |
انتخاب پلن: Starter / Professional / Business / Enterprise
      |
ثبت‌نام و ساخت Tenant
      |
پرداخت یا شروع Trial
      |
دسترسی به پنل: myshop.platform.com/admin
      |
اتصال دامنه اختصاصی: myshop.com
      |
راه‌اندازی فروشگاه و فروش
      |
رشد، سپس Upgrade، سپس قابلیت بیشتر با داده دست‌نخورده
```

---

## ۱.۴ چهار نوع کاربر که هرگز قاطی نمی‌شوند

این تفکیک، ستون فقرات مدل هویت است.

| نوع | کیست | کجا احراز می‌شود | مثال |
| ----- | ------ | ------------------ | ------ |
| Platform Staff | تیم خودِ ما | Platform Admin realm | مدیر پلن‌ها، پشتیبانی سطح ۲ |
| Tenant User | صاحب یا کارمند کسب‌وکار مشتری | Platform Identity realm | Owner فروشگاه، ادمین محصولات |
| Shopper یا Customer | خریدار نهایی از فروشگاه مشتری | Storefront Customer realm | کسی که پرینتر می‌خرد |
| Machine Client | برنامه یا ایجنت | API credential realm | اپ موبایل مشتری، AI Agent |

> اشتباه مرگبار رایج: یکی کردن Tenant User و Shopper.
> اگر این دو یکی شوند، فردا نمی‌توانی بگویی این خریدار در ۴۰۰ فروشگاه حساب دارد بدون اینکه کل مدل دسترسی‌ات بترکد. جزئیات در `10-architecture/14-identity-realms.md`.

---

## ۱.۵ مفاهیم اصلی سیستم

| مفهوم | تعریف یک‌خطی |
| ------- | -------------- |
| User | هویت انسانی در پلتفرم. متعلق به هیچ Tenant نیست. |
| Tenant | مرز کسب‌وکار مشتری. واحد جداسازی داده و صورتحساب. |
| Membership | رابطه User و Tenant همراه با نقش. |
| Role | مجموعه‌ای از Permission. منطق کسب‌وکار در خودش ندارد. |
| Permission | آیا این کاربر اجازه این کار را دارد؟ |
| Feature | آیا این Tenant این قابلیت را خریده و روشن است؟ (Entitlement و Capability یکی شده) |
| Quota | این Tenant چقدر از یک منبع محدود می‌تواند مصرف کند؟ |
| Plan و PlanVersion | بسته فروش، نسخه‌دار، داده نه کد. |
| Subscription | این Tenant روی کدام PlanVersion است و در چه وضعیتی. |
| Ledger | دفتر دوطرفه پول. مرجع حقیقت مالی. |
| Customer یا Shopper | خریدار نهایی در فروشگاه یک Tenant. |

---

## ۱.۶ اهداف غیرعملکردی با عدد، نه شعار

این اعداد هدف فاز ۱ تا ۳ هستند و باید در تست‌های کارایی سنجیده شوند.

| معیار | هدف |
| ------- | ----- |
| p95 پاسخ API پنل | زیر ۳۰۰ms |
| p95 صفحه محصول فروشگاه با cache hit | زیر ۱۰۰ms |
| p95 صفحه محصول فروشگاه با cache miss | زیر ۵۰۰ms |
| p95 مسیر Login | زیر ۴۰۰ms |
| دسترس‌پذیری API | ۹۹.۹٪ |
| RPO یعنی حداکثر داده از دست رفته | حداکثر ۵ دقیقه |
| RTO یعنی حداکثر زمان بازیابی | حداکثر ۱ ساعت |
| ظرفیت هدف فاز ۳ | ۱۰۰۰ Tenant فعال، ۵۰ RPS پایدار |

> اگر عدد ندارید، بودجه کارایی ندارید و هر کندی قابل قبول به نظر می‌رسد. جزئیات در `40-engineering/48-performance-budgets.md`.

---

## ۱.۷ خارج از دامنه به‌صورت صریح

این‌ها امروز ساخته نمی‌شوند و این تصمیم آگاهانه است:

Microservices، Kubernetes، Kafka، Service Mesh، Multi-Region، OpenSearch، Vector DB اختصاصی، Plugin Sandbox واقعی، Marketplace، Agent Framework پیچیده، SSO و SAML سازمانی، حسابداری کامل.

هر کدام شرط ورود مشخص دارند: `60-delivery/61-roadmap-phases.md`.
