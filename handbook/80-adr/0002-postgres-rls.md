# ADR-0002: PostgreSQL RLS for tenant isolation

## Status

Accepted

## Context

Application-only tenant filters are too easy to bypass accidentally.

## Decision

Use shared database/shared schema with `tenant_id` and PostgreSQL RLS enforced via transaction-local tenant context (`SET LOCAL app.tenant_id`).

## Consequences

### Positive

- Defense in depth
- Strong guarantee against accidental cross-tenant reads/writes

### Negative

- Slightly more complex repository and test setup
- Requires DB role discipline

## Non-negotiables

- App role is not table owner
- No BYPASSRLS
- FORCE ROW LEVEL SECURITY enabled where applicable
