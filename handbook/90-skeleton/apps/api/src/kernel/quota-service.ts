import type { Tx } from './unit-of-work';

/**
 * Atomic quota reservation.
 *
 * The whole point: the limit check lives INSIDE the UPDATE statement.
 * Any version that reads the counter first and writes later has a race
 * condition that only shows up in production under real concurrency.
 *
 * AMENDMENT v3 fixes three defects that made the original unrunnable:
 *   F-010  `interval 15` is not valid PostgreSQL -> `interval '15 minutes'`
 *   F-011  status was inserted as the integer 5, violating the CHECK
 *          constraint status IN ('pending','committed','released')
 *   F-012  placeholder numbering did not line up with the column list
 * Plus two correctness gaps the original left open:
 *   - commit() and release() were not idempotent and could double-count
 *     when a retry replayed them
 *   - commit() with an actual quantity larger than the reservation could
 *     push used_value past limit_value
 */
export interface Reservation {
  id: string;
  tenantId: string;
  quotaKey: string;
  periodStart: Date;
  quantity: number;
  status?: 'pending' | 'committed' | 'released';
}

export class QuotaExceeded extends Error {
  readonly code = 'billing.quota_exceeded';
  readonly status = 429;
  constructor(readonly quotaKey: string) {
    super('quota exceeded: ' + quotaKey);
  }
}

export class QuotaNotConfigured extends Error {
  readonly code = 'billing.quota_not_configured';
  readonly status = 409;
  constructor(readonly quotaKey: string) {
    super('no active quota period: ' + quotaKey);
  }
}

const RESERVATION_TTL = '15 minutes';

const FIND_RESERVATION = `
  select id, tenant_id as "tenantId", quota_key as "quotaKey",
         period_start as "periodStart", quantity, status
    from quota_reservations
   where idempotency_key = $1`;

const FIND_PERIOD = `
  select period_start
    from quota_counters
   where tenant_id = $1 and quota_key = $2
     and now() between period_start and period_end`;

// The single most important statement in the whole codebase.
// The limit is part of the WHERE clause, so two concurrent reservations
// cannot both win. Zero rows returned means "no capacity", full stop.
const RESERVE = `
  update quota_counters
     set reserved_value = reserved_value + $3
   where tenant_id = $1
     and quota_key = $2
     and now() between period_start and period_end
     and used_value + reserved_value + $3 <= limit_value
  returning period_start`;

const INSERT_RESERVATION = `
  insert into quota_reservations
    (id, tenant_id, quota_key, period_start, quantity, status,
     idempotency_key, expires_at, created_at)
  values
    (gen_random_uuid(), $1, $2, $3, $4, 'pending',
     $5, now() + interval '${RESERVATION_TTL}', now())
  returning id`;

// Both settlement statements are guarded by the reservation's own status,
// so replaying them is a no-op instead of a silent double count.
const COMMIT_RESERVATION = `
  update quota_reservations
     set status = 'committed'
   where id = $1 and status = 'pending'
  returning quantity`;

const RELEASE_RESERVATION = `
  update quota_reservations
     set status = 'released'
   where id = $1 and status = 'pending'
  returning quantity`;

const COMMIT_COUNTER = `
  update quota_counters
     set reserved_value = greatest(reserved_value - $4, 0),
         used_value     = used_value + $5
   where tenant_id = $1 and quota_key = $2 and period_start = $3`;

const RELEASE_COUNTER = `
  update quota_counters
     set reserved_value = greatest(reserved_value - $4, 0)
   where tenant_id = $1 and quota_key = $2 and period_start = $3`;

export class QuotaService {
  /**
   * reserve -> commit | release. Never read-then-write.
   * Call inside the same transaction as the business write.
   */
  async reserve(
    tx: Tx,
    tenantId: string,
    quotaKey: string,
    quantity: number,
    idempotencyKey: string,
  ): Promise<Reservation> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('quota_quantity_must_be_positive_integer');
    }

    const existing = await tx.query<Reservation>(FIND_RESERVATION, [idempotencyKey]);
    if (existing.length > 0) return existing[0];

    const updated = await tx.query<{ period_start: Date }>(RESERVE, [tenantId, quotaKey, quantity]);

    if (updated.length === 0) {
      // Distinguish "no capacity left" (429, upsell signal) from
      // "this tenant has no active period for this quota" (409, our bug).
      const period = await tx.query<{ period_start: Date }>(FIND_PERIOD, [tenantId, quotaKey]);
      if (period.length === 0) throw new QuotaNotConfigured(quotaKey);
      throw new QuotaExceeded(quotaKey);
    }

    const periodStart = updated[0].period_start;
    const inserted = await tx.query<{ id: string }>(INSERT_RESERVATION, [
      tenantId,
      quotaKey,
      periodStart,
      quantity,
      idempotencyKey,
    ]);

    return { id: inserted[0].id, tenantId, quotaKey, periodStart, quantity, status: 'pending' };
  }

  /**
   * Settle a reservation. actualQuantity may be lower than reserved
   * (partial use) but never higher: growing usage after the atomic check
   * would defeat the limit. Ask for a second reservation instead.
   */
  async commit(tx: Tx, r: Reservation, actualQuantity?: number): Promise<void> {
    const actual = actualQuantity ?? r.quantity;
    if (actual > r.quantity) {
      throw new Error('quota_commit_exceeds_reservation');
    }

    const settled = await tx.query<{ quantity: number }>(COMMIT_RESERVATION, [r.id]);
    if (settled.length === 0) return; // already settled, idempotent

    await tx.query(COMMIT_COUNTER, [r.tenantId, r.quotaKey, r.periodStart, r.quantity, actual]);
  }

  async release(tx: Tx, r: Reservation): Promise<void> {
    const settled = await tx.query<{ quantity: number }>(RELEASE_RESERVATION, [r.id]);
    if (settled.length === 0) return; // already settled, idempotent

    await tx.query(RELEASE_COUNTER, [r.tenantId, r.quotaKey, r.periodStart, r.quantity]);
  }
}
