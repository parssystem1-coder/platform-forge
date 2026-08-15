# ADR-0007: Transactional outbox

## Status

Accepted

## Context

Publishing events right after a commit can lose events, and publishing before commit can emit events for
rolled-back state. Both produce inconsistencies that are extremely hard to debug later.

## Decision

Write domain data and the event record in the same transaction. A separate worker publishes them using row-level
skip locking, exponential backoff, and a dead letter path after repeated failures.

## Consequences

### Positive

- No lost events
- Multiple workers scale safely
- New consumers require no changes to write paths

### Negative

- At-least-once delivery, so all consumers must be idempotent
- The outbox table needs retention management
