# ADR-0014: Custom domains treated as an operations concern

## Status

Accepted

## Context

The first draft listed custom domains as a bullet point. In practice it involves DNS verification, automated
certificate issuance at scale, certificate authority rate limits, renewal failure handling, and per-host routing.

## Decision

Treat custom domains as a dedicated phase with explicit operational requirements: verification records, automated
issuance with retry and alerting, host-to-tenant mapping cached in Redis, and a documented failure runbook.
Subdomains ship earlier because they need no per-tenant certificate work.

## Consequences

### Positive

- Realistic scheduling
- Certificate failures become visible and actionable

### Negative

- Custom domains are unavailable in early phases
- Requires an infrastructure decision about the terminating proxy
