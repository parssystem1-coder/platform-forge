# برنامه اجرای فاز ۶

## Workstream A: Definitions

- [ ] feature_definitions migration
- [ ] quota_definitions migration
- [ ] key validation و namespace rules
- [ ] platform feature registry
- [ ] contract tests

## Workstream B: Plans

- [ ] plans
- [ ] plan_versions
- [ ] plan_features
- [ ] plan_quotas
- [ ] price snapshots
- [ ] draft/published/retired lifecycle
- [ ] admin CRUD contract

## Workstream C: Tenant Assignment

- [ ] tenant_plan_assignments
- [ ] effective resolver
- [ ] cache invalidation
- [ ] default trial assignment
- [ ] version pinning test

## Workstream D: Authorization Integration

- [ ] replace config FeatureResolver
- [ ] 402 missing feature
- [ ] quota read contract
- [ ] downgrade behavior
- [ ] override expiry
- [ ] authorization matrix tests

## Workstream E: Admin and Observability

- [ ] Platform Admin plan screens contract
- [ ] Audit plan changes
- [ ] effective feature debug endpoint
- [ ] resolver metrics
- [ ] cache hit/miss metrics

## Workstream F: Gate

- [ ] old subscription remains on old version
- [ ] new tenant gets published version
- [ ] feature disabled returns 402
- [ ] quota exceeded returns 429
- [ ] downgrade does not delete rows
- [ ] full tenant leak and authorization suites
