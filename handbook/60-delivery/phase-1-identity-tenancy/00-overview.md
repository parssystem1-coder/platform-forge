# Phase 1: Identity + Tenancy + Authorization

## Overview

This phase implements the complete identity system including:

- User registration and authentication
- Tenant management
- Membership system
- Session management
- Token rotation
- Email verification
- MFA (TOTP)
- Authorization for 4 realms

## Entry Criteria

From `P-DEBT` gate:

- ✅ All 34 code findings fixed
- ✅ Unit tests passing (34 tests)
- ✅ TypeScript compilation passing
- ✅ Dependency boundaries green
- ✅ Error catalog v2 complete
- ⏳ Tenant-leak test on real PostgreSQL (conditional)

## Exit Criteria

- All identity use cases implemented
- All tenancy use cases implemented  
- All authorization paths working
- REST API endpoints functional
- OpenAPI spec updated
- Unit tests passing
- Integration tests passing
- Tenant-leak test green
- `pnpm verify` green

## Deliverables

1. **Identity Module** - User registration, login, logout, MFA
2. **Tenancy Module** - Tenant CRUD, membership management, switch
3. **Access Control Module** - 4 realm authorization
4. **REST API** - All endpoints
5. **Migrations** - Phase 1 tables
6. **Tests** - Unit + Integration + E2E

## Documentation

- [Phase Plan (English)](../../P-IDENTITY-PLAN.md)
- [Backlog](./01-backlog.md)
- [Migration Plan](./02-migrations.md)
- [API Contract](./03-api-contract.md)

## Start Date

2026-08-15 (after P-DEBT conditional pass)
