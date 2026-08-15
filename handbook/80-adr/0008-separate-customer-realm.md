# ADR-0008: Separate storefront customer identity realm

## Status

Accepted

## Context

The first draft modelled only platform users, yet described a shopper-facing chatbot. Merging shoppers with
platform users causes email uniqueness conflicts across tenants, cross-tenant privacy leakage, and a risk of
privilege escalation through membership bugs.

## Decision

Maintain four separate identity realms: platform staff, tenant users, storefront customers, and machine clients.
Customers live in a tenant-scoped table with a composite unique key on tenant and email, and they are authorized by
record ownership rather than by permissions.

## Consequences

### Positive

- The same email can shop in many stores independently
- Guest checkout is natural
- No privilege escalation path from shopper to admin

### Negative

- Two session mechanisms to maintain
- Slight duplication in authentication code
