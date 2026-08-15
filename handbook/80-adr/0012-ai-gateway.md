# ADR-0012: Mandatory AI gateway

## Status
Accepted

## Context
Modules calling providers directly duplicates retry logic, hides cost, prevents fallback, and makes prompt
versioning impossible.

## Decision
All AI calls go through a single gateway responsible for model routing, retries, fallback, cost accounting, credit
reservation, rate limiting, prompt versioning, and logging. Credits use the atomic reservation pattern because the
real cost is only known after the response arrives.

## Consequences
### Positive
- Cost is controllable and attributable per tenant
- Provider swaps are local changes
- Prompt changes are reproducible

### Negative
- One more hop in the call path
- The gateway becomes a critical component requiring its own monitoring
