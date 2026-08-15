# فاز ۰: Foundation واقعی

## هدف

ساخت زیرساختی که همه فازهای بعدی بتوانند بدون بازنویسی هسته روی آن سوار شوند.

## خروجی نهایی

```text
Developer checkout
 -> pnpm install
 -> docker compose up
 -> pnpm db:migrate
 -> pnpm dev
 -> /healthz و /readyz سبز
 -> CI سبز
 -> Architecture boundary test سبز
 -> PostgreSQL با RLS آماده
```

## در این فاز ساخته نمی‌شود

Commerce، Billing، AI، MCP، Plugin، Marketplace، CRM، SEO، OAuth و دامنه اختصاصی.
این‌ها هنوز مصرف‌کننده زیرساخت هستند، نه خود زیرساخت.

## اصل موفقیت

فاز ۰ وقتی تمام است که یک توسعه‌دهنده جدید بتواند در کمتر از ۳۰ دقیقه پروژه را بالا بیاورد و یک Pull Request با تست سبز باز کند.
