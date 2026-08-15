#!/usr/bin/env bash
# =====================================================================
# ci/db-full-verify.sh — full-push verification of the data layer.
#
# Applies the ENTIRE handbook migration chain to a fresh PostgreSQL 16
# database, in canonical order, using the documented role model, then
# asserts the security/ownership invariants from
# handbook/30-data/ddl/amendment/0000_bootstrap_roles.sql (section 5)
# and runs the P-DEBT validation suite as the untrusted app role.
#
# Any failed statement aborts the run (ON_ERROR_STOP).
# =====================================================================
set -euo pipefail

LOG_FILE="/tmp/db-verify.log"
exec > >(tee -a "$LOG_FILE") 2>&1

handle_error() {
  local exit_code=$?
  echo "=== SCRIPT FAILED WITH EXIT CODE $exit_code AT LINE $1 ==="
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    echo "## Database Full Chain Verification Failed" >> "$GITHUB_STEP_SUMMARY"
    echo "\`\`\`text" >> "$GITHUB_STEP_SUMMARY"
    tail -n 50 "$LOG_FILE" >> "$GITHUB_STEP_SUMMARY"
    echo "\`\`\`" >> "$GITHUB_STEP_SUMMARY"
  fi
  exit "$exit_code"
}

trap 'handle_error $LINENO' ERR

DDL_DIR="${DDL_DIR:-handbook/30-data/ddl}"
MIGRATION_PASSWORD="${MIGRATION_PASSWORD:-ci-migration-password}"
APP_PASSWORD="${APP_PASSWORD:-ci-app-password}"
WORKER_PASSWORD="${WORKER_PASSWORD:-ci-worker-password}"

PGHOST="${PGHOST:-127.0.0.1}"
if [ "$PGHOST" = "localhost" ]; then
  PGHOST="127.0.0.1"
fi
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-platform}"
PGSUPERUSER="${PGSUPERUSER:-postgres}"
PGSUPERPASSWORD="${PGSUPERPASSWORD:-postgres}"

export PGHOST PGPORT PGDATABASE PGSUPERUSER PGSUPERPASSWORD

MIGRATIONS=(
  "0001_core.sql"
  "0002_commerce.sql"
  "0003_rls_phase2.sql"
  "phase-1/0004_identity_constraints.sql"
  "phase-2/0005_commerce_indexes.sql"
  "phase-3/0006_reliability.sql"
  "phase-5/0007_commerce_runtime.sql"
  "phase-6/0008_features_plans.sql"
  "phase-7/0009_billing.sql"
  "amendment/0009_policy_cleanup.sql"
  "amendment/0010_rls_hardening.sql"
  "amendment/0011_ledger_integrity.sql"
  "amendment/0012_outbox_hardening.sql"
  "amendment/0013_outbox_platform_scope.sql"
)

psql_super() {
  PGUSER="$PGSUPERUSER" PGPASSWORD="$PGSUPERPASSWORD" \
    psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -X -v ON_ERROR_STOP=1 "$@"
}

psql_role() {
  local role="$1" pw="$2"; shift 2
  PGUSER="$role" PGPASSWORD="$pw" \
    psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -X -v ON_ERROR_STOP=1 "$@"
}

sql_super() {
  PGUSER="$PGSUPERUSER" PGPASSWORD="$PGSUPERPASSWORD" \
    psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -X -v ON_ERROR_STOP=1 -Atc "$1"
}

echo "Waiting for Postgres at $PGHOST:$PGPORT..."
for i in {1..30}; do
  if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGSUPERUSER" >/dev/null 2>&1; then
    echo "Postgres is ready."
    break
  fi
  sleep 1
done

echo "== phase 0: bootstrap roles (superuser) =="
psql_super -f "$DDL_DIR/amendment/0000_bootstrap_roles.sql"

# Ephemeral CI credentials so later steps can log in as each role.
sql_super "ALTER ROLE platform_migration PASSWORD '$MIGRATION_PASSWORD';"
sql_super "ALTER ROLE platform_app       PASSWORD '$APP_PASSWORD';"
sql_super "ALTER ROLE platform_worker    PASSWORD '$WORKER_PASSWORD';"

echo "== phase 1: applying ${#MIGRATIONS[@]} migrations as platform_migration =="
for m in "${MIGRATIONS[@]}"; do
  echo "--> Applying migration: $m"
  psql_role platform_migration "$MIGRATION_PASSWORD" -f "$DDL_DIR/$m"
done

VALIDATION_SQL="tests/sql/p-debt-validation.sql"
if [ ! -f "$VALIDATION_SQL" ]; then
  VALIDATION_SQL="handbook/90-skeleton/tests/sql/p-debt-validation.sql"
fi

echo "== phase 2: P-DEBT validation suite (as platform_app) =="
psql_role platform_app "$APP_PASSWORD" -f "$VALIDATION_SQL"

echo "== phase 3: audit assertions =="

fail() { echo "AUDIT FAILURE: $1"; exit 1; }

# 3.1 No application role may bypass RLS or hold superuser.
bad_roles=$(sql_super "
  SELECT string_agg(rolname || ' bypassrls=' || rolbypassrls || ' super=' || rolsuper, ', ')
    FROM pg_roles
   WHERE rolname IN ('platform_app','platform_worker','platform_readonly')
     AND (rolbypassrls OR rolsuper);")
[ -z "$bad_roles" ] || fail "unsafe role flags: $bad_roles"
echo "   OK  app/worker/readonly: NOBYPASSRLS, non-superuser"

# 3.2 Every schema object must be owned by the migration role.
not_owned=$(sql_super "
  SELECT count(*) FROM pg_tables
   WHERE schemaname = 'public' AND tableowner <> 'platform_migration';")
[ "$not_owned" = "0" ] || fail "$not_owned tables not owned by platform_migration"
echo "   OK  all tables owned by platform_migration"

# 3.3 Every tenant-bound table must have ENABLE + FORCE row level security.
missing_rls=$(sql_super "
  SELECT coalesce(string_agg(DISTINCT c.relname, ', '), '')
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
   WHERE n.nspname = 'public' AND c.relkind = 'r'
     AND a.attname = 'tenant_id' AND a.attnum > 0 AND NOT a.attisdropped
     AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity);")
[ -z "$missing_rls" ] || fail "tenant tables without forced RLS: $missing_rls"
echo "   OK  every tenant-bound table has FORCE ROW LEVEL SECURITY"

tables=$(sql_super "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';")
echo "   OK  $tables tables in public schema"

echo
echo "=== FULL DATA CHAIN VERIFIED: bootstrap -> ${#MIGRATIONS[@]} migrations -> validation -> audit ==="
