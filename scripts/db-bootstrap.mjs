#!/usr/bin/env node
/**
 * Database Bootstrap Script
 * 
 * This script creates the database roles and sets up initial permissions.
 * It replaces the psql-based bootstrap for cross-platform compatibility.
 * 
 * Usage:
 *   DATABASE_URL_SUPER=postgres://postgres:password@localhost:5432/postgres node scripts/db-bootstrap.mjs
 */

import pg from 'pg';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIGRATION_FILE = resolve(__dirname, '../handbook/30-data/ddl/amendment/0000_bootstrap_roles.sql');

async function bootstrap() {
  const connectionString = process.env.DATABASE_URL_SUPER || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL_SUPER or DATABASE_URL environment variable required.');
    console.error('   Example: DATABASE_URL_SUPER=postgres://postgres:password@localhost:5432/postgres node scripts/db-bootstrap.mjs');
    process.exit(1);
  }

  console.log('🔌 Connecting to PostgreSQL...');
  const pool = new pg.Pool({ connectionString });
  
  try {
    // Test connection
    const client = await pool.connect();
    const serverVersion = await client.query('SELECT version()');
    console.log(`✅ Connected to: ${serverVersion.rows[0].version.split(',')[0]}`);
    client.release();

    // Read and execute bootstrap SQL
    console.log(`📄 Reading bootstrap SQL: ${MIGRATION_FILE}`);
    const sql = readFileSync(MIGRATION_FILE, 'utf-8');
    
    console.log('⚙️  Creating roles and permissions...');
    await client.query(sql);
    
    console.log('✅ Bootstrap completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Set passwords for the new roles:');
    console.log('      - platform_migration');
    console.log('      - platform_app');
    console.log('      - platform_worker');
    console.log('');
    console.log('   2. Create the database:');
    console.log('      CREATE DATABASE platform_forge_dev;');
    console.log('');
    console.log('   3. Grant schema usage:');
    console.log('      GRANT USAGE ON SCHEMA public TO platform_migration;');
    console.log('');
    console.log('   4. Run migrations:');
    console.log('      node scripts/migrate.mjs');
    
  } catch (error) {
    console.error('❌ Bootstrap failed:', error.message);
    
    if (error.code === '28P01') {
      console.error('   → Authentication failed. Check your password.');
    } else if (error.code === '3D000') {
      console.error('   → Database does not exist. Create it first.');
    } else if (error.code === '42501') {
      console.error('   → Permission denied. Are you running as superuser (postgres)?');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

bootstrap();
