import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import { MembershipNotFound } from '../../../kernel/authorization.js';

export class SwitchTenantUseCase {
  constructor(private readonly uow: UnitOfWork) {}

  async execute(userId: string, targetTenantId: string): Promise<{ success: boolean; tenantId: string }> {
    return this.uow.withPlatform(userId, async (tx) => {
      const rows = await tx.query<{ id: string }>(
        `SELECT id FROM memberships
          WHERE user_id = $1 AND tenant_id = $2 AND status = 'active';`,
        [userId, targetTenantId],
      );

      if (rows.length === 0) {
        throw new MembershipNotFound();
      }

      return { success: true, tenantId: targetTenantId };
    });
  }
}
