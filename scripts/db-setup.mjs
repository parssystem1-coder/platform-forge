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
import { readFileSync, writeFileSync } from 'node:fs';
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
  'amendment/0014_emergency_products_rls.sql',
];

async function setup() {
  // Load .env file if exists (use process.cwd() for cross-platform compatibility)
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    console.log('📄 Loading environment from:', envPath);
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
          console.log(`   ✓ Set ${key}`);
        }
      }
    }
  } else {
    console.log('⚠️  No .env file found at:', envPath);
    console.log('   Environment variables must be set directly or use:');
    console.log('   DATABASE_URL_SUPER=postgres://postgres:password@localhost:5432/postgres pnpm db:setup');
  }

  console.log('   Current DATABASE_URL_SUPER:', process.env.DATABASE_URL_SUPER || '(not set)');

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
  
  // Generate random passwords if not set or if they're placeholder values
  const generatePassword = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase() + '1!';
  
  const currentAppPassword = process.env.PLATFORM_APP_PASSWORD;
  const isPlaceholder = !currentAppPassword || currentAppPassword === 'CHANGE_ME' || currentAppPassword.includes('CHANGE');
  const APP_PASSWORD = isPlaceholder ? generatePassword() : currentAppPassword;
  
  const currentWorkerPassword = process.env.PLATFORM_WORKER_PASSWORD;
  const WORKER_PASSWORD = (!currentWorkerPassword || currentWorkerPassword.includes('CHANGE')) ? generatePassword() : currentWorkerPassword;
  
  const currentMigrationPassword = process.env.PLATFORM_MIGRATION_PASSWORD;
  const MIGRATION_PASSWORD = (!currentMigrationPassword || currentMigrationPassword.includes('CHANGE')) ? generatePassword() : currentMigrationPassword;
  
  try {
    // Test connection
    const testClient = await superPool.connect();
    const serverVersion = await testClient.query('SELECT version()');
    console.log(`✅ Connected to: ${serverVersion.rows[0].version.split(',')[0]}`);

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

    // Connect as platform_migration - build URL from components to avoid parsing issues
    const pgHost = superConnectionString.match(/@([^:]+)/)?.[1] || 'localhost';
    const pgPort = superConnectionString.match(/:(\d+)\//)?.[1] || '5432';
    const dbName = DB_NAME;
    
    const migrationUrl = `postgres://platform_migration:${MIGRATION_PASSWORD}@${pgHost}:${pgPort}/${dbName}`;
    console.log(`🔌 Connecting as platform_migration to ${pgHost}:${pgPort}/${dbName}...`);
    
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
    console.log('🔑 Role passwords:');
    console.log(`   platform_migration: ${MIGRATION_PASSWORD}`);
    console.log(`   platform_app: ${APP_PASSWORD}`);
    console.log(`   platform_worker: ${WORKER_PASSWORD}`);
    
    // Update .env file with DATABASE_URL_APP
    const newAppUrl = `postgres://platform_app:${APP_PASSWORD}@localhost:5432/${DB_NAME}`;
    const newWorkerUrl = `postgres://platform_worker:${WORKER_PASSWORD}@localhost:5432/${DB_NAME}`;
    
    if (existsSync(envPath)) {
      let envContent = readFileSync(envPath, 'utf-8');
      
      // Replace DATABASE_URL_APP
      if (envContent.includes('DATABASE_URL_APP=')) {
        envContent = envContent.replace(/DATABASE_URL_APP=.*/, `DATABASE_URL_APP=${newAppUrl}`);
      } else {
        envContent += `\nDATABASE_URL_APP=${newAppUrl}`;
      }
      
      // Replace DATABASE_URL_WORKER if exists, otherwise add it
      if (envContent.includes('DATABASE_URL_WORKER=')) {
        envContent = envContent.replace(/DATABASE_URL_WORKER=.*/, `DATABASE_URL_WORKER=${newWorkerUrl}`);
      } else {
        envContent += `\nDATABASE_URL_WORKER=${newWorkerUrl}`;
      }
      
      // Update passwords
      if (envContent.includes('PLATFORM_APP_PASSWORD=')) {
        envContent = envContent.replace(/PLATFORM_APP_PASSWORD=.*/, `PLATFORM_APP_PASSWORD=${APP_PASSWORD}`);
      }
      if (envContent.includes('PLATFORM_WORKER_PASSWORD=')) {
        envContent = envContent.replace(/PLATFORM_WORKER_PASSWORD=.*/, `PLATFORM_WORKER_PASSWORD=${WORKER_PASSWORD}`);
      }
      if (envContent.includes('PLATFORM_MIGRATION_PASSWORD=')) {
        envContent = envContent.replace(/PLATFORM_MIGRATION_PASSWORD=.*/, `PLATFORM_MIGRATION_PASSWORD=${MIGRATION_PASSWORD}`);
      }
      
      writeFileSync(envPath, envContent);
      console.log('');
      console.log('📄 Updated .env file with DATABASE_URL_APP and passwords');
    }
    
    console.log('');
    console.log('✅ Ready to run tenant-leak tests!');
    console.log(`   pnpm test:tenant-leak`);
    
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
