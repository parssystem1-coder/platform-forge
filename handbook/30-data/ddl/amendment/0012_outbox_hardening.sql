-- =====================================================================
-- 0012_outbox_hardening.sql  (AMENDMENT v3)
-- Closes: debt D-006, F-013, F-014
-- Gives the outbox an explicit claim lifecycle so a worker crash cannot
-- lose an event and a slow consumer cannot stall the queue.
-- =====================================================================

ALTER TABLE outbox_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS claimed_by text NULL,
  ADD COLUMN IF NOT EXISTS claim_expires_at timestamptz NULL;

ALTER TABLE outbox_events DROP CONSTRAINT IF EXISTS outbox_events_status_check;
ALTER TABLE outbox_events
  ADD  CONSTRAINT outbox_events_status_check
  CHECK (status IN ('pending', 'claimed', 'published', 'dead'));

-- Backfill for anything already published.
UPDATE outbox_events SET status = 'published' WHERE published_at IS NOT NULL AND status = 'pending';

-- The claim scan index. Partial, because published rows are the majority.
DROP INDEX IF EXISTS idx_outbox_pending;
CREATE INDEX IF NOT EXISTS outbox_claimable_idx
  ON outbox_events (available_at, occurred_at)
  WHERE status IN ('pending', 'claimed');

-- A stuck claim is reclaimable. This is what makes crash recovery work
-- without a distributed lock service.
CREATE INDEX IF NOT EXISTS outbox_stuck_claims_idx
  ON outbox_events (claim_expires_at)
  WHERE status = 'claimed';

-- Per-consumer dedup, so at-least-once delivery is actually safe.
-- processed_events already exists from 0006; add the retention index.
CREATE INDEX IF NOT EXISTS processed_events_processed_at_idx
  ON processed_events (processed_at);

-- F-014: the sample publisher did `insert into outbox_dead_letters select *`
-- across two tables whose columns do not match. Give it a real function
-- so the mapping lives in one place and is testable.
CREATE OR REPLACE FUNCTION outbox_dead_letter(p_event_id uuid, p_error text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO outbox_dead_letters (
    id, original_event_id, aggregate_type, aggregate_id, tenant_id,
    event_type, event_version, payload, occurred_at, attempts,
    last_error, dead_lettered_at, correlation_id
  )
  SELECT gen_random_uuid(), e.id, e.aggregate_type, e.aggregate_id, e.tenant_id,
         e.event_type, e.event_version, e.payload, e.occurred_at, e.attempts,
         p_error, now(), e.correlation_id
    FROM outbox_events e
   WHERE e.id = p_event_id;

  UPDATE outbox_events
     SET status = 'dead', last_error = p_error, claimed_by = NULL, claim_expires_at = NULL
   WHERE id = p_event_id;
END $$;

-- Observability: queue lag is a first-class metric, not a guess.
CREATE OR REPLACE VIEW outbox_lag AS
  SELECT count(*) FILTER (WHERE status = 'pending')                        AS pending,
         count(*) FILTER (WHERE status = 'claimed')                        AS in_flight,
         count(*) FILTER (WHERE status = 'dead')                           AS dead,
         COALESCE(max(now() - occurred_at) FILTER (WHERE status = 'pending'),
                  interval '0')                                            AS oldest_pending_age;

GRANT SELECT ON outbox_lag TO platform_worker, platform_readonly;
