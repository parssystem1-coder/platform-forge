# ADR-0010: Drizzle ORM with explicit SQL

## Status
Accepted

## Context
Row level security requires transaction-local settings and predictable SQL. Heavy ORM abstractions obscure the
generated queries and complicate tenant-scoped transaction handling.

## Decision
Use Drizzle with SQL-first migrations and allow explicit SQL in repositories for sensitive paths such as quota
reservation, inventory reservation, and outbox polling.

## Consequences
### Positive
- Full control over generated SQL
- Natural fit with transaction-local tenant settings
- Easier performance reasoning

### Negative
- Less automatic scaffolding than a heavier ORM
- The team must be comfortable reading SQL
