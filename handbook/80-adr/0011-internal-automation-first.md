# ADR-0011: Internal automation gateway, n8n optional and later

## Status

Accepted

## Context

The first draft treated n8n as a core architectural component. Multi-tenant n8n is high risk: per-tenant credential
isolation, execution isolation, and execution limits are all non-trivial, and business logic placed inside workflows
becomes untestable and unreviewable.

## Decision

Build an internal automation gateway backed by the job queue. Treat n8n as an optional adapter in a later phase.
Workflows may only call APIs and may never contain business rules.

## Consequences

### Positive

- Automation is testable and reviewable
- No third-party dependency in the critical path
- Removing or replacing the workflow engine stays cheap

### Negative

- Less visual authoring initially
- Some integrations require code rather than drag and drop
