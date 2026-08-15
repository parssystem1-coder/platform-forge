# Event و Job Contract فاز ۳

## Job types

```text
outbox.publish
notification.send
read_model.project
reservation.expire
session.cleanup
outbox.retention
dead_letter.replay
```

## Reliability events

```text
system.outbox_dead_lettered
system.outbox_replayed
system.notification_queued
system.notification_sent
system.notification_failed
system.read_model_projected
system.read_model_rebuild_started
system.read_model_rebuild_completed
```

## Metrics

```text
worker_jobs_total
worker_job_duration_seconds
worker_job_failures_total
outbox_pending_count
outbox_oldest_age_seconds
outbox_dead_letters_total
notification_delivery_total
notification_delivery_failures_total
read_model_projection_lag_seconds
reservation_expiry_total
```
