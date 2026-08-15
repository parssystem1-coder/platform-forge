# ADR-0003: Opaque refresh tokens with rotation and reuse detection

## Status
Accepted

## Context
Stateless long-lived JWT refresh tokens are hard to revoke safely.

## Decision
Use short-lived JWT access tokens and opaque refresh tokens stored only as hashes in the database. Rotate refresh tokens on every use and revoke the token family on reuse detection.

## Consequences
### Positive
- Safer revocation
- Compromise detection
- Better device/session management

### Negative
- More DB writes on refresh path
- Slightly more implementation complexity
