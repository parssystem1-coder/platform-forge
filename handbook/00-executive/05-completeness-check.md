# چک کامل بودن معماری

> ⚠ **معنای تیک در این فایل (اصلاحیه نسخه ۳، یافته F-019):**
> تیک یعنی «طراحی شده و قرارداد دارد»، نه «ساخته شده».
> هیچ آیتمی در این فایل امروز پیاده‌سازی نشده است.
> وضعیت ساخت فقط در `99-amendment/10-status-of-artifacts-corrected.md` معتبر است.
>
> نمونه دقیق مشکل: ذیل «دسترسی و امنیت» تیک `RLS و FORCE RLS` خورده،
> در حالی که `outbox_events`، `outbox_dead_letters`، `ledger_lines` و
> `ledger_accounts` هیچ RLS ندارند و کل پالیسی‌های فاز ۱ تا ۳ فاقد
> `WITH CHECK` هستند.



این فایل قبل از تحویل هر نسخه اجرا می‌شود تا چیزی از معماری جا نماند.

## هویت و تنانسی

- [x] User مستقل از Tenant است
- [x] Membership رابطه User و Tenant است
- [x] Tenant Context تعریف شده
- [x] Platform Staff از Tenant User جداست
- [x] Shopper از Tenant User جداست
- [x] Machine Client از انسان جداست
- [x] Session، Refresh Rotation و Reuse Detection تعریف شده
- [x] Email Verification، Password Reset و MFA تعریف شده
- [x] Invitation و Owner lifecycle تعریف شده

## دسترسی و امنیت

- [x] Permission registry
- [x] Role matrix
- [x] Feature gate
- [x] Quota gate
- [x] authorize() واحد
- [x] RLS و FORCE RLS
- [x] app DB role بدون BYPASSRLS
- [x] Audit
- [x] Rate limit
- [x] Secrets policy
- [x] RFC 9457 errors
- [x] Threat model و incident runbook

## داده و پایداری

- [x] PostgreSQL source of truth
- [x] Redis نقش محدود و غیرمرجع
- [x] Object Storage برای فایل
- [x] pgvector برای فاز AI
- [x] Migration policy
- [x] Expand/Backfill/Contract
- [x] Backup، PITR، Restore Test
- [x] Data retention و anonymization
- [x] Tenant-bound table policy

## Commerce و Data Plane

- [x] Product و Variant
- [x] Customer Realm و Guest Checkout
- [x] Inventory reservation
- [x] Cart/Checkout boundary
- [x] Order snapshot
- [x] Storefront Read Model
- [x] CDN/ISR/Cache invalidation
- [x] Domain-to-Tenant mapping
- [x] Search migration trigger
- [x] Performance budgets

## پول و مصرف

- [x] Plan و PlanVersion
- [x] Add-on و Tenant Override
- [x] Subscription lifecycle
- [x] Invoice، Payment، Refund، Credit، Tax
- [x] Double-entry Ledger
- [x] Payment Webhook idempotency
- [x] Payment reconciliation
- [x] Feature resolver
- [x] Atomic quota reservation
- [x] Usage events
- [x] Reservation sweeper

## توسعه‌پذیری

- [x] Module boundaries
- [x] Application Service contract
- [x] Domain Events
- [x] Transactional Outbox
- [x] Workers
- [x] Public API versioning
- [x] API Identity
- [x] Webhook contract
- [x] AI Gateway
- [x] MCP contract
- [x] Automation Gateway
- [x] Plugin SDK boundary
- [x] Marketplace extension point

## Frontend و تجربه

- [x] Marketing Site
- [x] Storefront
- [x] Tenant Admin
- [x] Platform Admin
- [x] Design Tokens
- [x] RTL
- [x] Accessibility
- [x] Error-to-UI mapping
- [x] Generated SDK
- [x] Performance budget

## عملیات و تحویل

- [x] Local Compose
- [x] CI/CD
- [x] Architecture boundary test
- [x] Unit/Integration/E2E tests
- [x] Tenant Leak Suite
- [x] Health/Readiness/Metrics
- [x] Structured Logs/Traces
- [x] Release gates
- [x] Rollback runbook
- [x] Risk register
- [x] Traceability matrix

## نتیجه

این چک‌لیست نشان می‌دهد که بسته شامل چهار سطح است:

```text
Product Definition
  -> Architecture Contracts
    -> Implementation Skeleton
      -> Delivery and Operations
```

اگر آیتمی در این چک‌لیست تیک نخورده باشد، نسخه برای اجرای جدی آماده نیست.
