import { describe, it, expect, vi } from 'vitest';
import {
  AuthorizationService,
  Forbidden,
  FeatureNotAvailable,
  MembershipNotFound,
  InvalidTenantContext,
  NotResourceOwner,
} from './authorization.js';
import type { ActorContext } from '@platform/contracts';

describe('AuthorizationService', () => {
  const mockMemberships = {
    findActive: vi.fn(),
  };

  const mockRoles = {
    permissionsOf: vi.fn(),
  };

  const mockFeatures = {
    isEnabled: vi.fn(),
  };

  const mockOwnership = {
    ownsResource: vi.fn(),
  };

  const mockAudit = {
    record: vi.fn(),
  };

  const featureByPermission = {
    'commerce.product.create': 'commerce.catalog',
  };

  const quotaByPermission = {
    'commerce.product.create': 'commerce.products',
  };

  const service = new AuthorizationService(
    mockMemberships,
    mockRoles,
    mockFeatures,
    mockOwnership,
    mockAudit,
    featureByPermission,
    quotaByPermission,
  );

  it('authorizes a tenant user with valid permission and enabled feature', async () => {
    mockMemberships.findActive.mockResolvedValueOnce({ role: 'admin' });
    mockRoles.permissionsOf.mockReturnValueOnce(new Set(['commerce.product.create']));
    mockFeatures.isEnabled.mockResolvedValueOnce(true);

    const actor: ActorContext = {
      kind: 'user',
      userId: 'user-123',
      tenantId: 'tenant-456',
      correlationId: 'corr-1',
    };

    const res = await service.authorize(actor, 'commerce.product.create', {
      tenantId: 'tenant-456',
    });

    expect(res).toEqual({
      actorKind: 'user',
      tenantId: 'tenant-456',
      quotaKey: 'commerce.products',
      quantity: 1,
    });
  });

  it('rejects if feature is disabled on tenant plan with 402', async () => {
    mockMemberships.findActive.mockResolvedValueOnce({ role: 'admin' });
    mockRoles.permissionsOf.mockReturnValueOnce(new Set(['commerce.product.create']));
    mockFeatures.isEnabled.mockResolvedValueOnce(false);

    const actor: ActorContext = {
      kind: 'user',
      userId: 'user-123',
      tenantId: 'tenant-456',
      correlationId: 'corr-1',
    };

    await expect(
      service.authorize(actor, 'commerce.product.create', { tenantId: 'tenant-456' }),
    ).rejects.toThrow(FeatureNotAvailable);
  });

  it('authorizes platform staff and writes audit trail', async () => {
    const actor: ActorContext = {
      kind: 'staff',
      staffId: 'staff-99',
      staffPermissions: ['platform.tenant.read'],
      correlationId: 'corr-staff',
    };

    const res = await service.authorize(actor, 'platform.tenant.read', {
      tenantId: 'tenant-456',
    });

    expect(res.actorKind).toBe('staff');
    expect(mockAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'staff.access',
        actorKind: 'staff',
        actorId: 'staff-99',
        tenantId: 'tenant-456',
      }),
    );
  });

  it('authorizes machine client via scopes without userId requirement (F-015 fix)', async () => {
    mockFeatures.isEnabled.mockResolvedValueOnce(true);

    const actor: ActorContext = {
      kind: 'machine',
      clientId: 'client-key-1',
      scopes: ['commerce.product.create'],
      tenantId: 'tenant-456',
      correlationId: 'corr-mach',
    };

    const res = await service.authorize(actor, 'commerce.product.create', {
      tenantId: 'tenant-456',
    });

    expect(res.actorKind).toBe('machine');
    expect(res.quotaKey).toBe('commerce.products');
  });

  it('authorizes storefront customer when resource is owned', async () => {
    mockOwnership.ownsResource.mockResolvedValueOnce(true);

    const actor: ActorContext = {
      kind: 'customer',
      customerId: 'cust-1',
      tenantId: 'tenant-456',
      correlationId: 'corr-cust',
    };

    const res = await service.authorizeCustomer(actor, 'read', {
      tenantId: 'tenant-456',
      type: 'order',
      id: 'order-1',
    });

    expect(res.actorKind).toBe('customer');
  });

  it('rejects storefront customer when resource is not owned', async () => {
    mockOwnership.ownsResource.mockResolvedValueOnce(false);

    const actor: ActorContext = {
      kind: 'customer',
      customerId: 'cust-1',
      tenantId: 'tenant-456',
      correlationId: 'corr-cust',
    };

    await expect(
      service.authorizeCustomer(actor, 'read', {
        tenantId: 'tenant-456',
        type: 'order',
        id: 'order-2',
      }),
    ).rejects.toThrow(NotResourceOwner);
  });
});
