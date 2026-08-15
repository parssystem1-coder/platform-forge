-- =====================================================================
-- 0011_ledger_integrity.sql  (AMENDMENT v3)
-- Closes: F-004 F-005 F-009 F-031
-- Run as platform_migration after 0009_billing.sql and 0010.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. F-004: ledger_lines had no tenant_id and therefore no isolation.
--    Every tenant's financial lines were in one readable pile.
--    Denormalising tenant_id onto the line is deliberate: RLS cannot
--    follow a join, and a subquery-based policy is both slow and
--    bypassable through the parent row.
-- ---------------------------------------------------------------------
ALTER TABLE ledger_lines ADD COLUMN IF NOT EXISTS tenant_id uuid;

UPDATE ledger_lines l
   SET tenant_id = e.tenant_id
  FROM ledger_entries e
 WHERE e.id = l.entry_id
   AND l.tenant_id IS DISTINCT FROM e.tenant_id;

-- Every line must carry the same tenant boundary as its parent entry.
-- Fail explicitly if pre-existing data contains a platform-owned line. The
-- ledger model is tenant-scoped at line level after this amendment; silently
-- converting NULL would create an un-audited cross-scope financial record.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM ledger_lines WHERE tenant_id IS NULL) THEN
    RAISE EXCEPTION 'ledger_lines contains NULL tenant_id values; reconcile them before 0011';
  END IF;
END $$;
ALTER TABLE ledger_lines
  ALTER COLUMN tenant_id SET NOT NULL;

-- The line must always belong to the same tenant as its entry.
CREATE OR REPLACE FUNCTION ledger_line_tenant_matches_entry() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE entry_tenant uuid;
BEGIN
  SELECT tenant_id INTO entry_tenant FROM ledger_entries WHERE id = NEW.entry_id;
  IF NEW.tenant_id IS DISTINCT FROM entry_tenant THEN
    RAISE EXCEPTION 'ledger_line tenant_id % does not match entry tenant %',
      NEW.tenant_id, entry_tenant;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS ledger_lines_tenant_guard ON ledger_lines;
CREATE TRIGGER ledger_lines_tenant_guard
  BEFORE INSERT OR UPDATE ON ledger_lines
  FOR EACH ROW EXECUTE FUNCTION ledger_line_tenant_matches_entry();

ALTER TABLE ledger_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_lines FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ledger_lines_tenant_isolation ON ledger_lines;
CREATE POLICY ledger_lines_tenant_isolation ON ledger_lines
  FOR ALL TO platform_app
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

CREATE INDEX IF NOT EXISTS ledger_lines_tenant_entry_idx
  ON ledger_lines (tenant_id, entry_id);

-- ---------------------------------------------------------------------
-- 2. F-005: ledger_accounts was missing from the phase 7 RLS array
--    even though it carries tenant_id. Chart of accounts was public.
--    NULL tenant_id = platform-owned account, readable by everyone,
--    writable by nobody but migrations.
-- ---------------------------------------------------------------------
ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_accounts FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ledger_accounts_tenant_isolation ON ledger_accounts;

CREATE POLICY ledger_accounts_read ON ledger_accounts
  FOR SELECT TO platform_app
  USING (tenant_id IS NULL OR tenant_id = app_current_tenant());

CREATE POLICY ledger_accounts_write ON ledger_accounts
  FOR INSERT TO platform_app
  WITH CHECK (tenant_id = app_current_tenant());

-- ---------------------------------------------------------------------
-- 3. F-009: UNIQUE (source_type, source_id) was global. Two tenants
--    generating the same source_id meant the second tenant's financial
--    entry was silently rejected. Idempotency must be tenant-scoped.
-- ---------------------------------------------------------------------
ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_source_type_source_id_key;
ALTER TABLE ledger_entries
  ADD CONSTRAINT ledger_entries_tenant_source_unique
  UNIQUE (tenant_id, source_type, source_id);

-- ---------------------------------------------------------------------
-- 4. F-031: "double entry from day one" with nothing forcing balance.
--    A deferred constraint trigger means the check runs at COMMIT, so a
--    use case can insert the entry and its lines in any order, but can
--    never commit an unbalanced entry.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ledger_entry_must_balance() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_entry uuid := COALESCE(NEW.entry_id, OLD.entry_id);
  v_currency_count integer;
  v_debit  bigint;
  v_credit bigint;
  v_lines  int;
BEGIN
  SELECT count(*),
         COALESCE(sum(CASE WHEN direction = 'debit'  THEN amount_minor ELSE 0 END), 0),
         COALESCE(sum(CASE WHEN direction = 'credit' THEN amount_minor ELSE 0 END), 0),
         count(DISTINCT currency)
    INTO v_lines, v_debit, v_credit, v_currency_count
    FROM ledger_lines WHERE entry_id = v_entry;

  IF v_lines = 0 THEN
    RAISE EXCEPTION 'ledger entry % has no lines', v_entry;
  END IF;
  IF v_lines < 2 THEN
    RAISE EXCEPTION 'ledger entry % needs at least two lines, found %', v_entry, v_lines;
  END IF;
  IF v_debit <> v_credit THEN
    RAISE EXCEPTION 'ledger entry % unbalanced: debit % credit %', v_entry, v_debit, v_credit;
  END IF;

  IF v_currency_count > 1 THEN
    RAISE EXCEPTION 'ledger entry % mixes currencies', v_entry;
  END IF;

  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS ledger_entry_balance_guard ON ledger_lines;
CREATE CONSTRAINT TRIGGER ledger_entry_balance_guard
  AFTER INSERT OR UPDATE OR DELETE ON ledger_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION ledger_entry_must_balance();

-- Entry currency must match its lines.
ALTER TABLE ledger_lines
  DROP CONSTRAINT IF EXISTS ledger_lines_amount_positive;
ALTER TABLE ledger_lines
  ADD  CONSTRAINT ledger_lines_amount_positive CHECK (amount_minor > 0);

-- ---------------------------------------------------------------------
-- 5. Verification queries for the phase gate
-- ---------------------------------------------------------------------
-- unbalanced entries, must be zero:
-- SELECT entry_id FROM ledger_lines GROUP BY entry_id
--  HAVING sum(CASE WHEN direction='debit' THEN amount_minor ELSE -amount_minor END) <> 0;
