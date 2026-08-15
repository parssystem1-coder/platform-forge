#!/usr/bin/env node
/**
 * Database Setup Script
 * 
 * This script sets up the entire database for local development:
 * 1. Creates the database if it doesn't exist
 * 2. Creates roles with proper permissions
 * 3. Runs all migrations
 * 
 * Usage:
 *   DATABASE_URL_SUPER=postgres://postgres:password@localhost:5432/postgres node scripts/db-setup.mjs
 * 
 * Or set environment variables in .env and run:
 *   node scripts/db-setup.mjs
 */

import pg from 'pg';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DDL_DIR = resolve(__dirname, '../handbook/30-data/ddl');

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

async function setup() {
  // Load .env file if exists
  const envPath = resolve(__dirname, '../.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  }

  const superConnectionString = process.env.DATABASE_URL_SUPER || process.env.DATABASE_URL;
  
  if (!superConnectionString) {
    console.error('❌ DATABASE_URL_SUPER or DATABASE_URL environment variable required.');
    console.error('');
    console.error('Set in .env file:');
    console.error('   DATABASE_URL_SUPER=postgres://postgres:password@localhost:5432/postgres');
    console.error('');
    console.error('Or run directly:');
    console.error('   DATABASE_URL_SUPER=postgres://postgres:password@localhost:5432/postgres node scripts/db-setup.mjs');
    process.exit(1);
  }

  console.log('🔌 Connecting to PostgreSQL (superuser)...');
  const superPool = new pg.Pool({ connectionString: superConnectionString });
  
  const DB_NAME = process.env.PGDATABASE || 'platform_forge_dev';
  const APP_PASSWORD = process.env.PLATFORM_APP_PASSWORD || 'platform_app_password';
  const WORKER_PASSWORD = process.env.PLATFORM_WORKER_PASSWORD || 'platform_worker_password';
  const MIGRATION_PASSWORD = process.env.PLATFORM_MIGRATION_PASSWORD || 'platform_migration_password';
  
  try {
    // Test connection
    const testClient = await superPool.connect();
    const serverVersion = await testClient.query('SELECT version()');
    console.log(`✅ Connected to: ${serverVersion.rows[0].version.split(',')[0]}`);
    testClient.release();

    // Step 1: Create database
    console.log(`\n📦 Step 1: Creating database '${DB_NAME}'...`);
    try {
      await superPool.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`✅ Database '${DB_NAME}' created.`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`ℹ️  Database '${DB_NAME}' already exists, skipping.`);
      } else {
        throw error;
      }
    }

    // Step 2: Run bootstrap (create roles)
    console.log('\n⚙️  Step 2: Creating roles and permissions...');
    const bootstrapSql = readFileSync(resolve(DDL_DIR, 'amendment/0000_bootstrap_roles.sql'), 'utf-8');
    await superPool.query(bootstrapSql);
    console.log('✅ Roles created: platform_migration, platform_app, platform_worker');

    // Step 3: Set passwords
    console.log('\n🔑 Step 3: Setting role passwords...');
    await superPool.query(`ALTER ROLE platform_migration PASSWORD '${MIGRATION_PASSWORD}'`);
    await superPool.query(`ALTER ROLE platform_app PASSWORD '${APP_PASSWORD}'`);
    await superPool.query(`ALTER ROLE platform_worker PASSWORD '${WORKER_PASSWORD}'`);
    console.log('✅ Passwords set for all roles.');

    // Step 4: Grant schema usage
    console.log('\n🔓 Step 4: Granting schema permissions...');
    await superPool.query(`GRANT USAGE ON SCHEMA public TO platform_migration`);
    await superPool.query(`GRANT ALL PRIVILEGES ON SCHEMA public TO platform_app, platform_worker`);
    console.log('✅ Schema permissions granted.');

    // Step 5: Connect as platform_migration and run migrations
    console.log('\n🚀 Step 5: Running migrations as platform_migration...');
    await superPool.query(`GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO platform_migration`);
    
    testClient.release();
    await superPool.end();

    // Connect as platform_migration
    const migrationUrl = superConnectionString.replace('/postgres', `/${DB_NAME}`).replace('postgres@', `platform_migration:${MIGRATION_PASSWORD}@`);
    const migrationPool = new pg.Pool({ connectionString: migrationUrl });
    
    // Grant schema ownership
    await migrationPool.query(`GRANT ALL ON SCHEMA public TO platform_migration`);
    await migrationPool.query(`ALTER SCHEMA public OWNER TO platform_migration`);

    let appliedCount = 0;
    let skippedCount = 0;

    for (const migrationFile of MIGRATIONS) {
      const migrationPath = resolve(DDL_DIR, migrationFile);
      
      try {
        const sql = readFileSync(migrationPath, 'utf-8');
        console.log(`   → ${migrationFile}...`);
        await migrationPool.query(sql);
        appliedCount++;
        console.log(`   ✅ Applied: ${migrationFile}`);
      } catch (error) {
        if (error.code === '42P07' || error.message.includes('already exists')) {
          skippedCount++;
          console.log(`   ⏭️  Skipped: ${migrationFile} (already exists)`);
        } else {
          console.error(`   ❌ Failed: ${migrationFile}`);
          console.error(`      ${error.message}`);
          throw error;
        }
      }
    }

    await migrationPool.end();

    console.log('\n✅ Setup completed successfully!');
    console.log('');
    console.log('📝 Summary:');
    console.log(`   - Database: ${DB_NAME}`);
    console.log(`   - Migrations applied: ${appliedCount}`);
    console.log(`   - Migrations skipped: ${skippedCount}`);
    console.log('');
    console.log('🔑 Role passwords (save these!):');
    console.log(`   platform_migration: ${MIGRATION_PASSWORD}`);
    console.log(`   platform_app: ${APP_PASSWORD}`);
    console.log(`   platform_worker: ${WORKER_PASSWORD}`);
    console.log('');
    console.log('📄 Update your .env file:');
    console.log(`   DATABASE_URL_APP=postgres://platform_app:${APP_PASSWORD}@localhost:5432/${DB_NAME}`);
    console.log('');
    console.log('✅ Ready to run tenant-leak tests!');
    console.log(`   DATABASE_URL_APP=postgres://platform_app:${APP_PASSWORD}@localhost:5432/${DB_NAME} pnpm test:tenant-leak`);
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    
    if (error.code === '28P01') {
      console.error('   → Authentication failed. Check your password.');
    } else if (error.code === '42501') {
      console.error('   → Permission denied. Are you running as superuser (postgres)?');
    }
    
    process.exit(1);
  } finally {
    await superPool.end().catch(() => {});
  }
}

setup();
