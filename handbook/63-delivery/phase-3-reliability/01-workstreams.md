# مسیرهای کاری فاز ۳

## Workstream A: Worker Runtime

- [ ] worker process مستقل
- [ ] graceful shutdown
- [ ] concurrency limit
- [ ] health/readiness مخصوص worker
- [ ] job heartbeat و timeout
- [ ] structured job logs

## Workstream B: Outbox Publisher

- [ ] claim با `FOR UPDATE SKIP LOCKED`
- [ ] batch size قابل تنظیم
- [ ] exponential backoff
- [ ] dead-letter table
- [ ] retry classification
- [ ] retention job
- [ ] replay command با audit

## Workstream C: Notifications

- [ ] Notification domain
- [ ] Template registry
- [ ] locale selection
- [ ] tenant branding variables
- [ ] user preference
- [ ] Email adapter
- [ ] Mailpit integration
- [ ] provider timeout/retry

## Workstream D: Read Model

- [ ] projector interface
- [ ] Product event projector
- [ ] idempotent version check
- [ ] full rebuild command
- [ ] projection lag metric
- [ ] cache tag invalidation adapter

## Workstream E: Reliability

- [ ] idempotency store
- [ ] stuck job sweeper
- [ ] expired inventory reservation sweeper
- [ ] session/token cleanup
- [ ] database backup verification hook
- [ ] incident alerts

## Workstream F: Quality Gate

- [ ] duplicate event tests
- [ ] provider outage tests
- [ ] worker crash tests
- [ ] projector replay tests
- [ ] notification preference tests
- [ ] end-to-end order-to-email demo
