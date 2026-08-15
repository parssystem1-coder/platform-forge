# نقشه راه از صفر تا پلتفرم کامل

## مرحله ۰: Foundation

**هدف:** ابزار، دیتابیس، RLS، Kernel، CI و Outbox.

**نتیجه:** پروژه قابل اجرا و قابل نگهداری.

## مرحله ۱: Identity, Tenancy, Authorization

**هدف:** User، Session، Tenant، Membership، Role، Permission.

**نتیجه:** کاربر امن وارد محیط مستقل خودش می‌شود.

## مرحله ۲: Commerce MVP

**هدف:** Product، Variant، Customer، Cart، Checkout، Inventory، Order و Storefront.

**نتیجه:** اولین مشتری می‌تواند محصول بفروشد.

## مرحله ۳: Reliability و Notification

**هدف:** Worker، Email، Retry، Read Model، Monitoring و گزارش پایه.

**نتیجه:** سیستم فقط کار نمی‌کند، قابل اتکا هم هست.

## مرحله ۴: Feature و Plan

**هدف:** Plan، PlanVersion، Feature Resolver، Add-on پایه.

**نتیجه:** قابلیت‌ها به Tenant فروخته و گیت می‌شوند.

## مرحله ۵: Billing و Ledger

**هدف:** Subscription، Invoice، Payment، Refund، Tax، Proration، Reconciliation.

**نتیجه:** پلتفرم می‌تواند به‌صورت واقعی پول دریافت کند.

## مرحله ۶: Usage و Quota

**هدف:** AI credits، API calls، storage، products، orders و reservation اتمیک.

**نتیجه:** سقف‌ها قابل اعتماد و قابل صورتحساب هستند.

## مرحله ۷: Domains و Public API

**هدف:** subdomain، custom domain، API keys، OAuth، scopes، webhooks.

**نتیجه:** مشتری و توسعه‌دهنده بیرونی می‌توانند متصل شوند.

## مرحله ۸: AI Gateway

**هدف:** provider abstraction، model router، credits، prompt version، RAG foundation.

**نتیجه:** AI کنترل‌شده و tenant-aware.

## مرحله ۹: Automation

**هدف:** internal workflow، queue، trigger، action و Automation Gateway.

**نتیجه:** عملیات تکراری خودکار می‌شوند.

## مرحله ۱۰: MCP و Agent

**هدف:** tool registry، machine identity، tool authorization و audit.

**نتیجه:** Agentها از مسیر رسمی و امن با پلتفرم کار می‌کنند.

## مرحله ۱۱: CRM، SEO و دامنه‌های جدید

**هدف:** افزودن domainهای مستقل با همان Core.

**نتیجه:** محصول از Commerce به Platform واقعی تبدیل می‌شود.

## مرحله ۱۲: Plugin و Marketplace

**هدف:** SDK، manifest، compatibility، permission review و revenue share.

**نتیجه:** دیگران هم روی پلتفرم ارزش می‌سازند.

## مرحله ۱۳: Enterprise

**هدف:** White Label، SSO، dedicated workers، dedicated DB، dedicated AI و storage.

**نتیجه:** قرارداد Enterprise بدون تغییر Application Contract.

## قانون عبور

هر مرحله فقط با Gate خودش وارد مرحله بعد می‌شود. جلو رفتن بدون Gate یعنی بدهی پنهان، نه سرعت.
