import { describe, it, expect, vi } from 'vitest';
import { UnitOfWork } from './unit-of-work.js';
import type { Pool, Tx } from '@platform/contracts';

describe('UnitOfWork', () => {
  it('withTenant sets app.tenant_id and app.user_id within transaction', async () => {
    const executedQueries: Array<{ sql: string; params: unknown[] }> = [];

    const mockTx: Tx = {
      async query(sql: string, params?: unknown[]) {
        executedQueries.push({ sql, params: params ?? [] });
        return [];
      },
    };

    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        return fn(mockTx);
      },
    };

    const uow = new UnitOfWork(mockPool);

    const result = await uow.withTenant(
      { tenantId: 'tenant-123', userId: 'user-456' },
      async (tx) => {
        await tx.query('select * from products');
        return 'success';
      },
    );

    expect(result).toBe('success');
    expect(executedQueries).toEqual([
      { sql: 'select set_config($1, $2, true)', params: ['app.tenant_id', 'tenant-123'] },
      { sql: 'select set_config($1, $2, true)', params: ['app.user_id', 'user-456'] },
      { sql: 'select * from products', params: [] },
    ]);
  });

  it('withProvisioning sets app.provisioning = on', async () => {
    const executedQueries: Array<{ sql: string; params: unknown[] }> = [];

    const mockTx: Tx = {
      async query(sql: string, params?: unknown[]) {
        executedQueries.push({ sql, params: params ?? [] });
        return [];
      },
    };

    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        return fn(mockTx);
      },
    };

    const uow = new UnitOfWork(mockPool);

    const result = await uow.withProvisioning('user-999', async (tx) => {
      await tx.query('insert into tenants ...');
      return 'created';
    });

    expect(result).toBe('created');
    expect(executedQueries).toEqual([
      { sql: 'select set_config($1, $2, true)', params: ['app.user_id', 'user-999'] },
      { sql: 'select set_config($1, $2, true)', params: ['app.provisioning', 'on'] },
      { sql: 'insert into tenants ...', params: [] },
    ]);
  });
});
