# دروازه‌های عبور فازها

## Gate 0: Foundation

- [ ] Monorepo build می‌شود
- [ ] Local compose بالا می‌آید
- [ ] CI سبز است
- [ ] Dependency boundaries enforce می‌شوند
- [ ] Migration runner آماده است

## Gate 1: Identity + Tenancy

- [ ] Register تا email verify کار می‌کند
- [ ] Login، refresh rotation و logout کار می‌کند
- [ ] MFA و password reset تست شده‌اند
- [ ] دو Tenant داده یکدیگر را نمی‌بینند
- [ ] آخرین Owner قابل حذف نیست
- [ ] Audit و Outbox ثبت می‌شوند

## Gate 2: Commerce MVP

- [ ] Tenant User محصول می‌سازد
- [ ] محصول در storefront دیده می‌شود
- [ ] Customer و Guest checkout کار می‌کنند
- [ ] رزرو موجودی هم‌زمان امن است
- [ ] Order snapshot قیمت دارد
- [ ] Cancel و retry idempotent هستند
- [ ] p95 در بودجه است

## Gate 3: Operations

- [ ] Email retry دارد
- [ ] Worker قابل scale است
- [ ] Dashboard متریک‌ها ساخته شده
- [ ] Runbook Incident تست شده
- [ ] Backup restore انجام شده

## Gate 4: Features + Billing

- [ ] حداقل سه پلن واقعی وجود دارد
- [ ] PlanVersion مشتری قدیمی را نمی‌شکند
- [ ] Feature missing با 402 برمی‌گردد
- [ ] Ledger برای پرداخت تراز است
- [ ] webhook reconciliation کار می‌کند

## Gate 5: Production readiness

- [ ] threat model بازبینی شده
- [ ] load test اجرا شده
- [ ] dependency scan سبز است
- [ ] RPO/RTO با restore test اثبات شده
- [ ] rollback plan مستند است
