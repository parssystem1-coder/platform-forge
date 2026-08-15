# دستور تحویل به تیم یا Coding Agent

## ورودی‌های اجباری

- این repository از ابتدا خالی است
- Node.js 22 LTS
- pnpm 9+
- PostgreSQL 16+
- Redis 7+
- Docker Compose

## قوانین اجرای کار

1. اول `PLAN.md` بساز، بعد کد.
2. تسک‌ها بیشتر از ۴ ساعت نباشند.
3. هر تسک باید تست داشته باشد.
4. هر migration باید SQL و rollback plan داشته باشد.
5. هر endpoint باید OpenAPI داشته باشد.
6. هر tenant table باید RLS و leak test داشته باشد.
7. هر write مهم باید Audit و Outbox را در همان transaction بنویسد.
8. بعد از هر تسک `pnpm verify` اجرا شود.
9. اگر سند و نیاز جدید تضاد داشت، ADR جدید بنویس؛ silently تغییر نده.
10. کد خارج از فاز جاری ممنوع است.

## ترتیب فایل‌هایی که Agent باید بخواند

```text
AGENT_BRIEF.md
README.md
00-executive/01-product-definition.md
00-executive/05-completeness-check.md
10-architecture/12-layering-and-dependency-rules.md
10-architecture/15-multitenancy-and-isolation.md
10-architecture/16-access-control.md
30-data/31-data-model-core.md
30-data/ddl/0001_core.sql
40-engineering/42-testing-strategy.md
60-delivery/62-phase-1-execution-plan.md
60-delivery/68-phase-1-backlog.md
60-delivery/63-definition-of-done.md
```

## سؤال‌هایی که قبل از Production باید پاسخ داده شوند

- Provider ایمیل Production چیست؟
- Provider پرداخت چیست و کشور/ارز اصلی چیست؟
- دامنه اصلی و استراتژی DNS چیست؟
- محیط Deploy کجاست؟ Cloud VM، managed platform یا Kubernetes؟
- سیاست Backup و مالک هشدارها چه کسی است؟
- آیا Persian-first هستیم یا English-first؟
- سیاست نگهداری داده و الزامات حقوقی بازار هدف چیست؟

این سؤال‌ها مانع شروع فاز ۱ نیستند، ولی قبل از فاز ۵ و Production باید قطعی شوند.
