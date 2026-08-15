import type { TenantMembershipDto } from '@platform/contracts';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';

export class ListUserTenantsUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(userId: string): Promise<TenantMembershipDto[]> {
    return this.uow.withPlatform(userId, async (tx) => {
      const rows = await tx.query<{
        tenant_id: string;
        tenant_slug: string;
        tenant_name: string;
        role: string;
        status: string;
      }>(
        `SELECT m.tenant_id, t.slug AS tenant_slug, t.name AS tenant_name, m.role, m.status
           FROM memberships m
           JOIN tenants t ON t.id = m.tenant_id
          WHERE m.user_id = $1 AND m.status = 'active' AND t.status = 'active';`,
        [userId],
      );

      return rows.map((r) => ({
        tenantId: r.tenant_id,
        tenantSlug: r.tenant_slug,
        tenantName: r.tenant_name,
        role: r.role,
        status: r.status,
      }));
    });
  }
}
