# ADR-0009: Storefront read model with edge caching

## Status

Accepted

## Context

The storefront is the high-traffic, read-heavy, SEO-critical surface, while the admin panel is low-traffic and
write-heavy. Serving both with the same transactional query patterns fails on the storefront.

## Decision

Project catalog data into a denormalized read model updated from domain events, served through incremental static
regeneration and a CDN with tag-based invalidation. Inventory shown on product pages may be approximate, while
checkout uses exact atomic reservation.

## Consequences

### Positive

- Product pages served in one query or straight from cache
- Traffic spikes absorbed at the edge
- Admin correctness stays untouched

### Negative

- Eventual consistency between panel edits and storefront, target under 30 seconds
- Projector code must be maintained and monitored
