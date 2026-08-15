# ADR-0001: Modular Monolith for initial platform core

## Status
Accepted

## Context
We need a greenfield SaaS core with strong module boundaries, fast iteration, and production-safe multitenancy.
Premature microservices would slow delivery, multiply failure modes, and hide bad boundaries under network calls.

## Decision
Use a NestJS modular monolith with explicit module boundaries and architecture enforcement in CI.

## Consequences
### Positive
- Faster delivery
- Simpler local dev
- Stronger transactional consistency
- Easier refactoring while domain boundaries stabilize

### Negative
- Requires discipline to prevent big ball of mud
- Future extraction must be deliberate

## Review trigger
Revisit only when one bounded context shows sustained scaling/operational pain that cannot be solved in-process.
