import { describe, it, expect, vi } from 'vitest';
import {
  QuotaService,
  QuotaExceeded,
  QuotaNotConfigured,
} from './quota-service.js';
import type { Tx } from '@platform/contracts';

describe('QuotaService', () => {
  const service = new QuotaService();

  it('reserves quota when capacity exists in atomic update', async () => {
    const mockTx: Tx = {
      query: vi.fn()
        // 1. FIND_RESERVATION
        .mockResolvedValueOnce([])
        // 2. RESERVE (returning period_start)
        .mockResolvedValueOnce([{ period_start: new Date('2026-08-01') }])
        // 3. INSERT_RESERVATION
        .mockResolvedValueOnce([{ id: 'res-1' }]),
    };

    const reservation = await service.reserve(
      mockTx,
      'tenant-1',
      'commerce.products',
      1,
      'idem-1',
    );

    expect(reservation.id).toBe('res-1');
    expect(reservation.quantity).toBe(1);
    expect(reservation.status).toBe('pending');
  });

  it('returns existing reservation when idempotency key matches', async () => {
    const existing = {
      id: 'res-existing',
      tenantId: 'tenant-1',
      quotaKey: 'commerce.products',
      periodStart: new Date('2026-08-01'),
      quantity: 1,
      status: 'pending' as const,
    };

    const mockTx: Tx = {
      query: vi.fn().mockResolvedValueOnce([existing]),
    };

    const reservation = await service.reserve(
      mockTx,
      'tenant-1',
      'commerce.products',
      1,
      'idem-1',
    );

    expect(reservation).toEqual(existing);
  });

  it('throws QuotaExceeded (429) when update returns 0 rows but period exists', async () => {
    const mockTx: Tx = {
      query: vi.fn()
        // 1. FIND_RESERVATION
        .mockResolvedValueOnce([])
        // 2. RESERVE (0 rows returned because limit reached)
        .mockResolvedValueOnce([])
        // 3. FIND_PERIOD (period exists)
        .mockResolvedValueOnce([{ period_start: new Date('2026-08-01') }]),
    };

    await expect(
      service.reserve(mockTx, 'tenant-1', 'commerce.products', 1, 'idem-1'),
    ).rejects.toThrow(QuotaExceeded);
  });

  it('throws QuotaNotConfigured (409) when tenant has no configured period', async () => {
    const mockTx: Tx = {
      query: vi.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]), // no period found
    };

    await expect(
      service.reserve(mockTx, 'tenant-1', 'commerce.unconfigured', 1, 'idem-1'),
    ).rejects.toThrow(QuotaNotConfigured);
  });
});
