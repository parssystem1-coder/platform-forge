# برنامه اجرای فاز ۳

## Sprint 1: Worker Runtime

1. Worker bootstrap و config
2. Job interface و handler registry
3. graceful shutdown
4. concurrency و timeout
5. health/readiness
6. worker integration test

## Sprint 2: Outbox Hardening

1. dead-letter migration
2. retry policy
3. error classification: transient/permanent
4. publisher metrics
5. replay command
6. retention job
7. failure injection tests

## Sprint 3: Notification Platform

1. Notification entity و status
2. template registry
3. locale resolver
4. preference resolver
5. EmailSender port
6. SMTP/Mailpit adapter
7. order confirmation template
8. verification/password templates
9. delivery tracking

## Sprint 4: Projection and Cache

1. projector port
2. product projection handler
3. version/idempotency check
4. rebuild projection command
5. cache invalidation adapter
6. lag dashboard

## Sprint 5: Cleanup and Recovery

1. expired reservation sweeper
2. stale idempotency cleanup
3. expired session cleanup
4. dead-letter alert
5. outbox backlog alert
6. backup verification runbook

## Sprint 6: Gate

1. order-to-email e2e
2. worker crash/restart test
3. duplicate event test
4. provider outage test
5. projector replay test
6. performance smoke test
7. phase gate review
