#!/usr/bin/env node
import path from 'node:path';
import pg from 'pg';
import { DatabaseMigrator } from '../packages/database/dist/index.js';

const { Pool } = pg;

const MIGRATIONS = [
  '0001_core.sql',
  '0002_commerce.sql',
  '0003_rls_phase2.sql',
  'phase-1/0004_identity_constraints.sql',
  'phase-2/0005_commerce_indexes.sql',
  'phase-3/0006_reliability.sql',
  'phase-5/0007_commerce_runtime.sql',
  'phase-6/0008_features_plans.sql',
  'phase-7/0009_billing.sql',
  'amendment/0009_policy_cleanup.sql',
  'amendment/0010_rls_hardening.sql',
  'amendment/0011_ledger_integrity.sql',
  'amendment/0012_outbox_hardening.sql',
  'amendment/0013_outbox_platform_scope.sql',
];

const ddlDir = process.env.DDL_DIR || path.resolve(process.cwd(), 'handbook/30-data/ddl');
const connectionString = process.env.DATABASE_URL_MIGRATION || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL or DATABASE_URL_MIGRATION environment variable required.');
  process.exit(1);
}

async function run() {
  const pgPool = new Pool({ connectionString });
  const pool = {
    async transaction(fn) {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        const tx = {
          async query(sql, params) {
            const res = await client.query(sql, params);
            return res.rows;
          },
        };
        const result = await fn(tx);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
  };

  const migrator = new DatabaseMigrator(pool, {
    ddlDir,
    migrations: MIGRATIONS,
  });

  console.log('Starting migration run...');
  const { applied, skipped } = await migrator.migrate();

  console.log(`✓ Migration complete: ${applied.length} applied, ${skipped.length} skipped.`);
  await pgPool.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
