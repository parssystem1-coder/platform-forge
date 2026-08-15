# Backlog بستن بدهی معماری

## D-001 تا D-002: Repository واقعی

- [ ] `pnpm-workspace.yaml`
- [ ] `turbo.json`
- [ ] root `tsconfig.json`
- [ ] `apps/api/package.json`
- [ ] `apps/worker/package.json`
- [ ] `apps/web/package.json` یا تصمیم صریح برای defer
- [ ] `pnpm-lock.yaml`
- [ ] NestJS bootstrap
- [ ] Worker bootstrap
- [ ] `/healthz`
- [ ] `/readyz`
- [ ] sample e2e

## D-003 تا D-005: DB و RLS واقعی

- [ ] bootstrap migration برای roleها و grants
- [ ] app connection با role واقعی
- [ ] `WITH CHECK` policies
- [ ] migration runner
- [ ] test helper واقعی
- [ ] RLS tests با دو database role
- [ ] test برای owner/bypassrls

## D-006: Outbox واقعی

- [ ] claim strategy انتخاب و ADR تکمیلی
- [ ] publisher transaction behavior
- [ ] dead-letter schema alignment
- [ ] consumer dedup table
- [ ] retry classification
- [ ] crash/restart test

## D-007: Agent governance

- [ ] `templates/PHASE_PLAN.md`
- [ ] `templates/OPEN_QUESTION.md`
- [ ] `templates/ADR.md`
- [ ] `templates/IMPLEMENTATION_REPORT.md`
- [ ] PR checklist مطابق Master Handoff
- [ ] phase gate command

## D-008: Contract enforcement

- [ ] OpenAPI generated from code یا code generated from OpenAPI
- [ ] route drift test
- [ ] error catalog drift test
- [ ] event schema validation

## Gate

- [ ] همه P0ها closed یا exception مستند دارند
- [ ] status-of-artifacts به‌روز است
- [ ] Agent می‌تواند Phase 2 را از repo واقعی ادامه دهد
