# ADR-0005: Double-entry ledger from day one

## Status
Accepted

## Context
The first draft had Invoice, Payment, Refund, Tax and Proration but no ledger, and Accounting was deferred.
Without a ledger, financial reconciliation becomes archaeology as soon as numbers disagree.

## Decision
Introduce a minimal double-entry ledger for every money movement, even before a full accounting module exists.
Amounts are stored as integer minor units. Entries are immutable and corrections happen through reversing entries.

## Consequences
### Positive
- Every money movement is explainable
- Reconciliation is possible
- Deferred revenue is representable

### Negative
- More writes per financial operation
- The team must understand debit and credit basics

## Non-negotiables
- No floating point for money
- No UPDATE or DELETE on ledger tables
- Balance constraint enforced in the database
