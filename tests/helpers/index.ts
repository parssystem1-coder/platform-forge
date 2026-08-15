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
import pg from 'pg';
const { Pool: PgPool } = pg;
import { randomUUID } from 'node:crypto';

export interface TestTx {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface TestPool {
  transaction<T>(fn: (tx: TestTx) => Promise<T>): Promise<T>;
  end(): Promise<void>;
}

function wrap(pool: pg.Pool): TestPool {
  return {
    async transaction<T>(fn: (tx: TestTx) => Promise<T>): Promise<T> {
      const client = await pool.connect();
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
    end: () => pool.end(),
  };
}

/** The application connection. NOBYPASSRLS, owns nothing. */
export async function createTestPool(): Promise<TestPool> {
  const url = process.env.DATABASE_URL_APP ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL_APP is required for integration tests');
  return wrap(new PgPool({ connectionString: url, max: 5 }));
}

/** The migration-owner connection. Used only for fixtures and assertions. */
export async function createOwnerPool(): Promise<TestPool> {
  const url = process.env.DATABASE_URL_OWNER ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL_OWNER is required for integration tests');
  return wrap(new PgPool({ connectionString: url, max: 5 }));
}

/**
 * Fixture: insert a tenant and one sample row for it, using the owner
 * connection so RLS doesn't block the setup.
 */
export async function seedTenant(ownerPool: TestPool, slug: string): Promise<string> {
  const tenantId = randomUUID();
  const userId = randomUUID();
  const productId = randomUUID();
  const orderId = randomUUID();
  const customerId = randomUUID();

  await ownerPool.transaction(async (tx) => {
    await tx.query(
      `insert into tenants (id, slug, name, status, created_at, updated_at)
       values ($1, $2, $2, 'active', now(), now())
       on conflict (slug) do update set updated_at = now()`,
      [tenantId, slug],
    );
    await tx.query(
      `insert into users (id, email, display_name, status, created_at, updated_at)
       values ($1, $2, $3, 'active', now(), now())
       on conflict do nothing`,
      [userId, `${slug}-owner@example.com`, `${slug} Owner`],
    );
    await tx.query(
      `insert into memberships (id, tenant_id, user_id, role, status, created_at, updated_at)
       values ($1, $2, $3, 'owner', 'active', now(), now())
       on conflict do nothing`,
      [randomUUID(), tenantId, userId],
    );
    await tx.query(
      `insert into products (id, tenant_id, slug, title, status, created_at, updated_at)
       values ($1, $2, $3, $4, 'active', now(), now())
       on conflict do nothing`,
      [productId, tenantId, `sample-${slug}`, `Sample ${slug}`],
    );
    await tx.query(
      `insert into customers (id, tenant_id, email, display_name, status, created_at, updated_at)
       values ($1, $2, $3, $4, 'active', now(), now())
       on conflict do nothing`,
      [customerId, tenantId, `${slug}-customer@example.com`, `${slug} Customer`],
    );
    await tx.query(
      `insert into orders (id, tenant_id, customer_id, order_number, status, currency, total_minor, created_at, updated_at)
       values ($1, $2, $3, $4, 'pending', 'USD', 1000, now(), now())
       on conflict do nothing`,
      [orderId, tenantId, customerId, `ORD-${slug}-001`],
    );
  });

  return tenantId;
}
