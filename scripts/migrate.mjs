#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;

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
  const client = new Client({ connectionString });
  await client.connect();

  console.log(`Connected to database. Applying ${MIGRATIONS.length} migrations...`);

  for (const file of MIGRATIONS) {
    const fullPath = path.join(ddlDir, file);
    console.log(`--> Applying: ${file}`);
    const sql = fs.readFileSync(fullPath, 'utf8');
    await client.query(sql);
  }

  console.log('✓ All migrations applied successfully.');
  await client.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
