# ADR-0013: MCP after API stability

## Status
Accepted

## Context
MCP is an interface, not an architecture. Exposing tools over an API surface that is still changing forces repeated
breaking changes on agent consumers, and agent access amplifies any authorization gap.

## Decision
Ship MCP only after the public API and the authorization model have been stable for at least one month. Every tool
carries mandatory metadata covering permission, feature, quota, credit cost, side effects, and audit policy, and it
routes through the same authorization path as human users.

## Consequences
### Positive
- Agents inherit a proven security model
- Tool contracts stay stable

### Negative
- Agent capabilities arrive later
