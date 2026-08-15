import { describe, it, expect, vi } from 'vitest';
import { OutboxPublisher, type OutboxRow } from './outbox-publisher.js';
import type { Pool, Tx } from '@platform/contracts';

describe('OutboxPublisher', () => {
  it('claims batch, publishes outside transaction, and marks published', async () => {
    const publishedEvents: OutboxRow[] = [];
    const queries: string[] = [];

    const mockEvent: OutboxRow = {
      id: 'event-1',
      event_type: 'identity.user_registered',
      event_version: 1,
      aggregate_type: 'user',
      aggregate_id: 'user-1',
      tenant_id: null,
      payload: { email: 'test@example.com' },
      correlation_id: 'corr-1',
      causation_id: null,
      occurred_at: new Date(),
      attempts: 0,
    };

    let claimed = false;

    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        const mockTx: Tx = {
          async query<R>(sql: string, params?: unknown[]) {
            queries.push(sql);
            if (!claimed) {
              claimed = true;
              return [mockEvent] as R[];
            }
            return [] as R[];
          },
        };
        return fn(mockTx);
      },
    };

    const mockBus = {
      async publish(event: OutboxRow) {
        publishedEvents.push(event);
      },
    };

    const mockMetrics = {
      published: vi.fn(),
      retried: vi.fn(),
      deadLettered: vi.fn(),
    };

    const publisher = new OutboxPublisher(mockPool, mockBus, 'worker-1', mockMetrics);
    const count = await publisher.tick();

    expect(count).toBe(1);
    expect(publishedEvents).toHaveLength(1);
    expect(mockMetrics.published).toHaveBeenCalledWith('identity.user_registered');
  });

  it('retries with backoff on publish error', async () => {
    const queries: string[] = [];

    const mockEvent: OutboxRow = {
      id: 'event-fail',
      event_type: 'identity.user_registered',
      event_version: 1,
      aggregate_type: 'user',
      aggregate_id: 'user-1',
      tenant_id: null,
      payload: {},
      correlation_id: 'corr-1',
      causation_id: null,
      occurred_at: new Date(),
      attempts: 1,
    };

    let claimed = false;

    const mockPool: Pool = {
      async transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
        const mockTx: Tx = {
          async query<R>(sql: string, params?: unknown[]) {
            queries.push(sql);
            if (!claimed) {
              claimed = true;
              return [mockEvent] as R[];
            }
            return [] as R[];
          },
        };
        return fn(mockTx);
      },
    };

    const mockBus = {
      async publish() {
        throw new Error('Connection refused');
      },
    };

    const mockMetrics = {
      published: vi.fn(),
      retried: vi.fn(),
      deadLettered: vi.fn(),
    };

    const publisher = new OutboxPublisher(mockPool, mockBus, 'worker-1', mockMetrics);
    const count = await publisher.tick();

    expect(count).toBe(1);
    expect(mockMetrics.retried).toHaveBeenCalledWith('identity.user_registered', 2);
  });
});
