/**
 * Outbox publisher.
 *
 * AMENDMENT v3 - the original sample published INSIDE the claim
 * transaction (F-013). Three things were wrong with that:
 *   1. a slow consumer held row locks for the whole batch
 *   2. any DB error rolled back the batch, so events that were already
 *      published to the bus were never marked, producing duplicates on
 *      the next tick with no dedup story
 *   3. it contradicted the project's own instruction in
 *      64-delivery/phase-4-architecture-debt/03-execution-order.md Step 6:
 *      "the handler runs outside the claim transaction"
 *
 * Correct shape, and the one implemented here:
 *   TX 1  claim a batch with FOR UPDATE SKIP LOCKED, set status='claimed'
 *         and a claim lease, then COMMIT immediately
 *   ---   publish outside any transaction
 *   TX 2  mark each event published, retried, or dead, one row at a time
 *
 * Crash safety comes from the lease: a claim whose claim_expires_at has
 * passed is reclaimable, so a killed worker loses nothing. Delivery is
 * at-least-once, which is why processed_events exists on the consumer side.
 */
import type { Pool } from '@platform/contracts';

const BACKOFF_SECONDS = [5, 30, 300, 1800, 7200];
const MAX_ATTEMPTS = 6;
const BATCH_SIZE = 100;
const CLAIM_LEASE_SECONDS = 60;

const CLAIM_BATCH = `
  with claimable as (
    select id
      from outbox_events
     where available_at <= now()
       and (
         status = 'pending'
         or (status = 'claimed' and claim_expires_at < now())
       )
     order by occurred_at
     limit $1
     for update skip locked
  )
  update outbox_events e
     set status = 'claimed',
         claimed_at = now(),
         claimed_by = $2,
         claim_expires_at = now() + make_interval(secs => $3)
    from claimable c
   where e.id = c.id
  returning e.id, e.event_type, e.event_version, e.aggregate_type,
            e.aggregate_id, e.tenant_id, e.payload, e.correlation_id,
            e.causation_id, e.occurred_at, e.attempts`;

const MARK_PUBLISHED = `
  update outbox_events
     set status = 'published', published_at = now(),
         claimed_by = null, claim_expires_at = null
   where id = $1`;

const SCHEDULE_RETRY = `
  update outbox_events
     set status = 'pending',
         attempts = $2,
         last_error = $3,
         available_at = now() + make_interval(secs => $4),
         claimed_by = null, claim_expires_at = null
   where id = $1`;

export interface OutboxRow {
  id: string;
  event_type: string;
  event_version: number;
  aggregate_type: string;
  aggregate_id: string;
  tenant_id: string | null;
  payload: Record<string, unknown>;
  correlation_id: string;
  causation_id: string | null;
  occurred_at: Date;
  attempts: number;
}

export interface EventBus {
  publish(event: OutboxRow): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface Metrics {
  published(eventType: string): void;
  retried(eventType: string, attempts: number): void;
  deadLettered(eventType: string): void;
}

export class OutboxPublisher {
  constructor(
    private readonly pool: Pool,
    private readonly bus: EventBus,
    private readonly workerId: string,
    private readonly metrics: Metrics,
  ) {}

  /** One tick. Returns how many events were handled. */
  async tick(): Promise<number> {
    // --- TX 1: claim and release the locks immediately -----------------
    const rows = await this.pool.transaction((tx) =>
      tx.query<OutboxRow>(CLAIM_BATCH, [BATCH_SIZE, this.workerId, CLAIM_LEASE_SECONDS]),
    );
    if (rows.length === 0) return 0;

    // --- publish outside any transaction ------------------------------
    for (const row of rows) {
      try {
        await this.bus.publish(row);
        // --- TX 2: one row, one short transaction ---------------------
        await this.pool.transaction((tx) => tx.query(MARK_PUBLISHED, [row.id]));
        this.metrics.published(row.event_type);
      } catch (error) {
        await this.handleFailure(row, error);
      }
    }

    return rows.length;
  }

  private async handleFailure(row: OutboxRow, error: unknown): Promise<void> {
    const attempts = row.attempts + 1;
    const message = error instanceof Error ? error.message : 'unknown';

    if (attempts >= MAX_ATTEMPTS) {
      // F-014: the dead-letter mapping lives in one tested SQL function,
      // not an `insert ... select *` across two mismatched tables.
      await this.pool.transaction((tx) =>
        tx.query('select outbox_dead_letter($1, $2)', [row.id, message]),
      );
      this.metrics.deadLettered(row.event_type);
      return;
    }

    const delay = BACKOFF_SECONDS[Math.min(attempts - 1, BACKOFF_SECONDS.length - 1)];
    await this.pool.transaction((tx) =>
      tx.query(SCHEDULE_RETRY, [row.id, attempts, message, delay]),
    );
    this.metrics.retried(row.event_type, attempts);
  }
}
