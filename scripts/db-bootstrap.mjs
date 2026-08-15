#!/usr/bin/env node
/**
 * Database Bootstrap Script
 * 
 * This script creates the database roles and sets up initial permissions.
 * It replaces the psql-based bootstrap for cross-platform compatibility.
 * 
 * Usage:
 *   DATABASE_URL_SUPER=postgres://postgres:password@localhost:5432/postgres node scripts/db-bootstrap.mjs
 * 
 * Or set in .env and run:
 *   pnpm db:bootstrap
 */

import pg from 'pg';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MIGRATION_FILE = resolve(process.cwd(), 'handbook/30-data/ddl/amendment/0000_bootstrap_roles.sql');

/** Load .env file if exists */
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    console.log('📄 Loading environment from:', envPath);
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

async function bootstrap() {
  loadEnv();
  
  const connectionString = process.env.DATABASE_URL_SUPER || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL_SUPER or DATABASE_URL environment variable required.');
    console.error('');
    console.error('Set in .env file:');
    console.error('   DATABASE_URL_SUPER=postgres://postgres:password@localhost:5432/postgres');
    console.error('');
    console.error('Or run directly:');
    console.error('   DATABASE_URL_SUPER=postgres://postgres:password@localhost:5432/postgres node scripts/db-bootstrap.mjs');
    process.exit(1);
  }

  console.log('🔌 Connecting to PostgreSQL...');
  const pool = new pg.Pool({ connectionString });
  
  try {
    // Test connection
    const client = await pool.connect();
    const serverVersion = await client.query('SELECT version()');
    console.log(`✅ Connected to: ${serverVersion.rows[0].version.split(',')[0]}`);

    // Read and execute bootstrap SQL
    console.log(`📄 Reading bootstrap SQL: ${MIGRATION_FILE}`);
    const sql = readFileSync(MIGRATION_FILE, 'utf-8');
    
    console.log('⚙️  Creating roles and permissions...');
    await client.query(sql);
    
    console.log('✅ Bootstrap completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Set passwords for the new roles (done by db:setup)');
    console.log('   2. Run: pnpm db:migrate');
    
    client.release();
    
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
