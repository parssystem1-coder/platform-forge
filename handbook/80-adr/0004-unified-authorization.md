# ADR-0004: Unified authorization with a merged Feature concept

## Status
Accepted

## Context
The first draft had seven distinct checks: auth, tenant, membership, permission, entitlement, capability, quota.
Entitlement and Capability answered nearly the same question, which guarantees an eventual contradiction with no
defined source of truth. Multiple decision points also invite forgotten checks.

## Decision
1. Merge Entitlement and Capability into a single concept named Feature.
2. Route every authorization decision through one function.
3. Distinguish error codes: 403 for permission, 402 for missing feature, 429 for exceeded quota.

## Consequences
### Positive
- One place to audit and test
- No contradictory answers
- Upsell UX becomes possible, since 402 is a business signal rather than an error

### Negative
- Slightly less conceptual granularity
- Requires discipline, since ad hoc role checks are banned

## Enforcement
CI searches for role comparison patterns outside the access-control module and fails the build.
