# ADR-0006: Atomic quota reservation

## Status

Accepted

## Context

Read-then-write quota checks race under concurrency. On metered resources such as AI credits this means selling
capacity that does not exist. Single-user testing never reveals this class of bug.

## Decision

Use a conditional UPDATE that increments a reserved counter only when the limit allows it, then commit or release
the reservation. Reservations carry an idempotency key and an expiry, and a sweeper releases stale ones.

## Consequences

### Positive

- No overselling
- Safe retries
- The stale reservation rate becomes a useful operational signal

### Negative

- Extra table and sweeper job
- Two-step protocol for callers

## Review trigger

If a single counter row becomes a write hotspot, shard the counter by period or sub-key.
