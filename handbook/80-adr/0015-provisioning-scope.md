# ADR-0015: Provisioning به‌عنوان یک scope رسمی سوم

## وضعیت

pending review — برخاسته از یافته F-033

## زمینه

پالیسی RLS جدول `tenants` به صورت `id = app.tenant_id` نوشته شده بود. این دو جریان حیاتی را غیرممکن می‌کند: ثبت‌نام (هنوز tenant وجود ندارد) و Tenant Switcher (باید چند tenant دیده شود).

معماری دو حالت داشت: با context و بدون context. واقعیت سه حالت دارد.

## تصمیم

سه scope رسمی:

| scope | تابع | جدول مجاز |
| --- | --- | --- |
| tenant | `withTenant()` | هر جدول `tenant_id`دار |
| platform | `withPlatform()` | فقط `PLATFORM_WIDE_TABLES` |
| provisioning | `withProvisioning()` | فقط `tenants` و `memberships`، فقط INSERT |

حالت سوم در دیتابیس با flag `app.provisioning` و پالیسی مختصوص محدود می‌شود. خواندن tenant بیرون از context از مسیر `memberships` و `app.user_id` انجام می‌شود.

## پیامد منفی

- یک flag دیگر در session state که باید مستند و تست شود.
- پالیسی خواندن tenant یک subquery روی `memberships` دارد؛ فقط در مسیر بدون context اجرا می‌شود، پس اثر کارایی محدود است.

## شرط بازبینی

اگر ثبت‌نام به یک جریان چندمرحله‌ای با تایید پرداخت تبدیل شود، این scope باید به یک saga تبدیل شود.
