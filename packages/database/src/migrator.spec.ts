import { describe, it, expect, vi } from 'vitest';
import { DatabaseMigrator } from './migrator.js';
import type { Pool, Tx } from '@platform/contracts';

describe('DatabaseMigrator', () => {
  it('detects new vs already applied migrations', async () => {
    const executedQueries: string[] = [];

    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        const mockTx: Tx = {
          async query<R>(sql: string, params?: unknown[]) {
            executedQueries.push(sql);
            if (sql.includes('SELECT id, name, checksum')) {
              return [
                {
                  id: 1,
                  name: '0001_core.sql',
                  checksum: 'abc123',
                  executed_at: new Date(),
                  duration_ms: 10,
                },
              ] as R[];
            }
            return [] as R[];
          },
        };
        return fn(mockTx);
      },
    };

    const migrator = new DatabaseMigrator(mockPool, {
      ddlDir: '/tmp',
      migrations: ['0001_core.sql'],
    });

    // Mock loadMigrationFiles
    vi.spyOn(migrator, 'loadMigrationFiles').mockReturnValue([
      {
        name: '0001_core.sql',
        fullPath: '/tmp/0001_core.sql',
        sql: 'CREATE TABLE sample();',
        checksum: 'abc123',
      },
      {
        name: '0002_commerce.sql',
        fullPath: '/tmp/0002_commerce.sql',
        sql: 'CREATE TABLE products();',
        checksum: 'def456',
      },
    ]);

    const result = await migrator.migrate();

    expect(result.skipped).toContain('0001_core.sql');
    expect(result.applied).toContain('0002_commerce.sql');
  });
});
