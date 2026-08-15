# PHASE_PLAN فاز ۵

## Workstream A: Catalog

| ID | Task | Acceptance |
|---|---|---|
| C5-001 | Product domain aggregate | invariant tests |
| C5-002 | Variant value object | price/currency/SKU tests |
| C5-003 | Product repository port | domain-independent interface |
| C5-004 | Postgres repository | tenant scoped integration test |
| C5-005 | Product migration | migration + RLS |
| C5-006 | CreateProduct use case | auth + audit + outbox |
| C5-007 | UpdateProduct use case | version/conflict test |
| C5-008 | ArchiveProduct use case | no hard delete |
| C5-009 | Admin product endpoints | OpenAPI + errors |

## Workstream B: Storefront Read Model

| ID | Task | Acceptance |
|---|---|---|
| C5-010 | Product event schemas | schema validation |
| C5-011 | Projection repository | idempotent version update |
| C5-012 | Product projector | replay test |
| C5-013 | Public product query | one read-model query |
| C5-014 | Host-to-tenant resolver | forged header ignored |
| C5-015 | Cache tag adapter | targeted invalidation |
| C5-016 | Projection lag metric | alert test |

## Workstream C: Customer and Cart

| ID | Task | Acceptance |
|---|---|---|
| C5-017 | Customer aggregate | tenant/email invariant |
| C5-018 | Guest customer use case | same email per tenant only |
| C5-019 | Customer session boundary | cannot access admin API |
| C5-020 | Cart aggregate | line quantity invariant |
| C5-021 | Cart repository | tenant and owner scoped |
| C5-022 | Cart endpoints | e2e guest flow |

## Workstream D: Inventory and Orders

| ID | Task | Acceptance |
|---|---|---|
| C5-023 | Inventory reservation SQL | atomic concurrency test |
| C5-024 | Reservation expiry job | release test |
| C5-025 | Order aggregate | valid state machine |
| C5-026 | Order line snapshot | price/title frozen |
| C5-027 | Checkout price re-read | stale read rejected |
| C5-028 | Fake payment adapter | success/failure paths |
| C5-029 | CreateOrder use case | idempotency test |
| C5-030 | Payment confirmation use case | pending to paid |
| C5-031 | CancelOrder use case | reservation release |

## Workstream E: Frontend and Demo

| ID | Task | Acceptance |
|---|---|---|
| C5-032 | Admin product form | validation/error states |
| C5-033 | Admin inventory view | accessible table |
| C5-034 | Storefront product page | RTL/responsive |
| C5-035 | Cart page | quantity/error states |
| C5-036 | Checkout page | idempotency key |
| C5-037 | Order success page | order number |

## Workstream F: Quality Gate

| ID | Task | Acceptance |
|---|---|---|
| C5-038 | Product tenant leak suite | green |
| C5-039 | Order ownership suite | green |
| C5-040 | Inventory 50-way concurrency test | max 10 success for stock 10 |
| C5-041 | Failure/retry e2e | no duplicate order |
| C5-042 | Performance smoke | budgets met |
| C5-043 | Architecture Status update | evidence linked |
| C5-044 | Phase gate review | PASS/HOLD |
