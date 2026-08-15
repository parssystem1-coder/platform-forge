# فاز ۴: Architecture Debt Closure

## چرا این فاز جلوتر از Feature Phase می‌آید؟

چون `MASTER_AGENT_HANDOFF` معماری را الزام می‌کند، اما بخشی از ابزارهای اجرای آن هنوز ساخته نشده‌اند. اگر حالا Feature جدید اضافه کنیم، بدهی را روی بدهی می‌سازیم و Agent به جای اجرای قرارداد، از sampleها برداشت اشتباه می‌کند.

## هدف

حل D-001 تا D-008 و آماده کردن repository واقعی برای ادامه Commerce.

## خروجی نهایی

```text
pnpm install
 -> pnpm verify
 -> docker compose up
 -> pnpm db:migrate
 -> pnpm test:tenant-leak
 -> pnpm dev
 -> real /healthz
 -> real /api/v1/test-boundary
```

## ترتیب اجباری

1. Repository bootstrap واقعی
2. NestJS API/Worker bootstrap
3. DB roles و migration runner
4. RLS hardening
5. Test harness واقعی
6. Outbox worker واقعی
7. OpenAPI drift check
8. Master Agent templates و phase gate
9. Full debt review

## خارج از دامنه

Billing، AI، Plugin، Marketplace، Microservice extraction و production payment.
