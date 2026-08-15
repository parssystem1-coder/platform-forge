# ردیابی یافته ← تسک ← تست

> قانون: هر یافته باید دقیقاً یک تست داشته باشد که قبل از اصلاح قرمز بوده باشد.
> اگر تست قبل از اصلاح قرمز نشده باشد، مطمئن نیستی چیزی را درست کرده‌ای.

| یافته | تسک | فایل اصلاح | تست اثبات |
|---|---|---|---|
| F-001 | T-02 | `ddl/amendment/0010` ۱ | `tests/rls/outbox-isolation.spec.ts` |
| F-002 | T-02 | `0010` ۱ | `tests/rls/outbox-isolation.spec.ts` |
| F-003 | T-12 | `tests/helpers/index.ts` | `tests/tenant-leak.spec.ts` (کل سوییت) |
| F-004 | T-05 | `0011` ۱ | `tests/rls/ledger-isolation.spec.ts` |
| F-005 | T-05 | `0011` ۲ | `tests/rls/ledger-isolation.spec.ts` |
| F-006 | T-03 | `0010` ۲ | `tests/rls/write-policy.spec.ts` |
| F-007 | T-04 | `0010` ۳ | `tests/rls/audit-immutable.spec.ts` |
| F-008 | T-06 | `0010` تابع | `tests/rls/empty-context.spec.ts` |
| F-009 | T-05 | `0011` ۳ | `tests/ledger/idempotency.spec.ts` |
| F-010 | T-14 | `quota-service.ts` | `tests/quota/reserve.spec.ts` |
| F-011 | T-14 | `quota-service.ts` | `tests/quota/reserve.spec.ts` |
| F-012 | T-14 | `quota-service.ts` | `tests/quota/reserve.spec.ts` |
| F-013 | T-15 | `outbox-publisher.ts` | `tests/outbox/crash-recovery.spec.ts` |
| F-014 | T-15 | `0012` تابع | `tests/outbox/dead-letter.spec.ts` |
| F-015 | T-16 | `authorization.ts` | `tests/authz/machine-client.spec.ts` |
| F-016 | T-13 | `unit-of-work.ts` | `tests/arch/single-tenant-path.spec.ts` |
| F-017 | T-18 | `packages/contracts` | `pnpm boundaries` |
| F-018 | T-26 | `08-acceptance-gate.md` | phase gate script |
| F-019 | T-23 | `10-status-of-artifacts-corrected.md` | ریویی دستی |
| F-020 | T-19 | `70-contracts/errors.md` | `scripts/error-catalog-drift.mjs` |
| F-021 | T-20 | `70-contracts/openapi.yaml` | `scripts/openapi-drift.mjs` |
| F-022 | T-17 | `authorization.ts` | `tests/arch/quota-reserved-in-usecase.spec.ts` |
| F-023 | T-21 | `05-canonical-phase-map.md` | grep test در CI |
| F-024 | T-21 | `README.md` | grep test در CI |
| F-025 | T-22 | ساختار پوشه | link checker |
| F-026 | T-22 | ادغام Commerce | link checker |
| F-027 | T-13 | `.dependency-cruiser.cjs` | `pnpm boundaries` |
| F-028 | T-24 | migration جدید | `tests/commerce/order-number.spec.ts` |
| F-029 | T-16 | `authorization.ts` | `tests/authz/customer-ownership.spec.ts` |
| F-030 | T-16 | `authorization.ts` | `tests/authz/staff-access.spec.ts` |
| F-031 | T-05 | `0011` ۴ | `tests/ledger/balance.spec.ts` |
| F-032 | T-01 | `0000_bootstrap_roles.sql` | `tests/rls/append-only.spec.ts` |
| F-033 | T-07 | `0010` ۴ | `tests/tenancy/registration.spec.ts` |
| F-034 | T-25 | `0010` ۵ | `tests/identity/session-create.spec.ts` |
