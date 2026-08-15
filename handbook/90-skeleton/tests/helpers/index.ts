/**
 * AMENDMENT v3 - closes debt D-005.
 *
 * tests/tenant-leak.spec.ts imported `./helpers` and the file did not
 * exist. The most important test suite in the project could not run, which
 * is why nine RLS holes survived seven phases of documentation.
 *
 * These helpers connect as platform_app on purpose. Seeding uses a
 * separate migration-owner connection, because the app role is not
 * allowed to create a tenant outside withProvisioning().
 */
import { Pool as PgPool } from 'pg';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Load .env file if exists - use process.cwd() for cross-platform compatibility */
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
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

// Load env at module initialization
loadEnv();

export interface TestTx {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface TestPool {
  transaction<T>(fn: (tx: TestTx) => Promise<T>): Promise<T>;
  end(): Promise<void>;
}

function wrap(pg: PgPool): TestPool {
  return {
    async transaction<T>(fn: (tx: TestTx) => Promise<T>): Promise<T> {
      const client = await pg.connect();
      try {
        await client.query('begin');
        const tx: TestTx = {
          async query<R>(sql: string, params?: unknown[]) {
            const res = await client.query(sql, params as unknown[]);
            return res.rows as R[];
          },
        };
        const out = await fn(tx);
        await client.query('commit');
        return out;
      } catch (e) {
        await client.query('rollback');
        throw e;
      } finally {
        client.release();
      }
    },
    end: () => pg.end(),
  };
}

/** The application connection. NOBYPASSRLS, owns nothing. */
export async function createTestPool(): Promise<TestPool> {
  const url = process.env.DATABASE_URL_APP ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL_APP environment variable is required for tenant-leak tests.\n' +
      'Set it in .env file or run:\n' +
      '  DATABASE_URL_APP=postgres://platform_app:password@localhost:5432/platform_forge_dev pnpm test:tenant-leak'
    );
  }
  return wrap(new PgPool({ connectionString: url, max: 5 }));
}

/** The migration-owner connection. Used only for fixtures and assertions. */
export async function createOwnerPool(): Promise<TestPool> {
  const url = process.env.DATABASE_URL_OWNER ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL_OWNER environment variable is required for tenant-leak tests.\n' +
      'Set it in .env file or run:\n' +
      '  DATABASE_URL_OWNER=postgres://postgres:password@localhost:5432/platform_forge_dev pnpm test:tenant-leak'
    );
  }
  return wrap(new PgPool({ connectionString: url, max: 5 }));
}

export async function seedTenant(owner: TestPool, slug: string): Promise<string> {
  const tenantId = randomUUID();
  await owner.transaction(async (tx) => {
    await tx.query(
      `insert into tenants (id, name, slug, status, locale, timezone, currency, created_at, updated_at)
       values ($1, $2, $3, 'active', 'en-US', 'UTC', 'USD', now(), now())`,
      [tenantId, slug, slug + '-' + tenantId.slice(0, 8)],
    );
  });
  return tenantId;
}

export async function seedUser(owner: TestPool, email: string): Promise<string> {
  const userId = randomUUID();
  await owner.transaction(async (tx) => {
    await tx.query(
      `insert into users (id, email, display_name, status, created_at, updated_at)
       values ($1, $2, $3, 'active', now(), now())`,
      [userId, userId.slice(0, 8) + '.' + email, email],
    );
  });
  return userId;
}

export async function seedMembership(
  owner: TestPool,
  tenantId: string,
  userId: string,
  role = 'owner',
): Promise<void> {
  await owner.transaction(async (tx) => {
    await tx.query(
      `insert into memberships (id, tenant_id, user_id, role, status, joined_at, created_at, updated_at)
       values (gen_random_uuid(), $1, $2, $3, 'active', now(), now(), now())`,
      [tenantId, userId, role],
    );
  });
}

export async function seedProduct(owner: TestPool, tenantId: string, slug: string): Promise<string> {
  const id = randomUUID();
  await owner.transaction(async (tx) => {
    await tx.query(
      `insert into products (id, tenant_id, slug, title, status, created_at, updated_at)
       values ($1, $2, $3, $4, 'active', now(), now())`,
      [id, tenantId, slug, slug],
    );
  });
  return id;
}

/** Every test owns its data. No shared fixtures, no test ordering. */
export async function truncateAll(owner: TestPool): Promise<void> {
  await owner.transaction(async (tx) => {
    const rows = await tx.query<{ tablename: string }>(
      `select tablename from pg_tables where schemaname = 'public'`,
    );
    const names = rows.map((r) => '"' + r.tablename + '"').join(', ');
    if (names) await tx.query('truncate ' + names + ' cascade');
  });
}
