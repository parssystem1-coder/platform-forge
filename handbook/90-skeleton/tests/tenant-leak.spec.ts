/**
 * The most important test suite in the project.
 *
 * It proves that a bug in application code cannot leak data across tenants,
 * because the database itself refuses. Run it against a real Postgres.
 * Mocking here defeats the entire purpose.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestPool, createOwnerPool, seedTenant, truncateAll, type TestPool } from './helpers';
import { UnitOfWork } from '../apps/api/src/kernel/unit-of-work';
import { randomUUID } from 'node:crypto';

describe('tenant isolation', () => {
  let appPool: TestPool;
  let ownerPool: TestPool;
  let uow: UnitOfWork;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    appPool = await createTestPool();
    ownerPool = await createOwnerPool();
    uow = new UnitOfWork(appPool as any);
    
    // Clear all data before seeding
    await truncateAll(ownerPool);
    
    // Use unique slugs to avoid conflicts
    const uniqueSuffix = randomUUID().slice(0, 8);
    tenantA = await seedTenant(ownerPool, `tenant-a-${uniqueSuffix}`);
    tenantB = await seedTenant(ownerPool, `tenant-b-${uniqueSuffix}`);
  });

  afterAll(async () => {
    await truncateAll(ownerPool);
    await appPool?.end();
    await ownerPool?.end();
  });

  it('scoped query only returns rows of the active tenant', async () => {
    const rows = await uow.withTenant(tenantA, (tx) =>
      tx.query('select id from products'),
    );
    const ids = rows.map((r: any) => r.id);
    const bRows = await uow.withTenant(tenantB, (tx) =>
      tx.query('select id from products'),
    );
    for (const row of bRows as any[]) {
      expect(ids).not.toContain(row.id);
    }
  });

  it('an unfiltered query still cannot see another tenant', async () => {
    // Deliberately omit the where clause. RLS must save us anyway.
    const rows = await uow.withTenant(tenantA, (tx) =>
      tx.query('select tenant_id from orders'),
    );
    for (const row of rows as any[]) {
      expect(row.tenant_id).toBe(tenantA);
    }
  });

  it('querying without tenant context returns nothing', async () => {
    const rows = await uow.withPlatform(null, (tx) =>
      tx.query('select id from products'),
    );
    expect(rows).toHaveLength(0);
  });

  it('the application role cannot bypass row level security', async () => {
    const rows = await appPool.transaction((tx) =>
      tx.query(
        'select rolbypassrls from pg_roles where rolname = current_user',
      ),
    );
    expect((rows as any[])[0].rolbypassrls).toBe(false);
  });

  it('the application role does not own the tables', async () => {
    const rows = await appPool.transaction((tx) =>
      tx.query(
        'select count(*)::int as owned from pg_tables where schemaname = $1 and tableowner = current_user',
        ['public'],
      ),
    );
    expect((rows as any[])[0].owned).toBe(0);
  });

  it('every tenant bound table has row level security forced', async () => {
    const rows = await appPool.transaction((tx) =>
      tx.query(
        'select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace join information_schema.columns col on col.table_name = c.relname where n.nspname = $1 and c.relkind = $2 and col.column_name = $3 and (c.relrowsecurity = false or c.relforcerowsecurity = false)',
        ['public', 'r', 'tenant_id'],
      ),
    );
    expect(rows).toEqual([]);
  });
});
