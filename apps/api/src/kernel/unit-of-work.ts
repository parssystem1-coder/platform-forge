/**
 * The only sanctioned way to touch tenant-bound data.
 *
 * AMENDMENT v3 (F-016, F-027, F-033):
 *   - This file is now the ONLY implementation. db/tenant-db.ts was a
 *     second, divergent copy of the same idea and has been removed.
 *   - app.user_id is set alongside app.tenant_id, because the tenants and
 *     memberships policies need it for the "list my tenants" path.
 *   - withoutTenant() is replaced by two narrow, named escapes so that a
 *     lint rule can actually police them:
 *       withPlatform()     -> platform-wide tables only (users, plans, ...)
 *       withProvisioning() -> the single transaction that creates a tenant
 *
 * Why SET LOCAL / set_config(..., true):
 *   transaction-scoped, so it cannot leak onto a pooled connection and be
 *   picked up by the next request from another tenant.
 *
 * Why set_config with a bind parameter:
 *   SET LOCAL does not accept parameters, so string interpolation would be
 *   required, which opens an injection path.
 */
import type { Pool, Tx } from '@platform/contracts';

export interface TenantScope {
  tenantId: string;
  userId?: string;
}

/** Tables allowed inside withPlatform(). Enforced by test, not by hope. */
export const PLATFORM_WIDE_TABLES = Object.freeze([
  'users',
  'user_credentials',
  'email_verification_tokens',
  'password_reset_tokens',
  'mfa_totp_factors',
  'mfa_recovery_codes',
  'sessions',
  'session_refresh_tokens',
  'plans',
  'plan_versions',
  'plan_features',
  'plan_quotas',
  'feature_definitions',
  'quota_definitions',
  'notification_templates',
  'processed_events',
]);

export class UnitOfWork {
  constructor(private readonly pool: Pool) {}

  /** Default path. 99% of use cases live here. */
  async withTenant<T>(scope: TenantScope | string, fn: (tx: Tx) => Promise<T>): Promise<T> {
    const tenantId = typeof scope === 'string' ? scope : scope.tenantId;
    const userId = typeof scope === 'string' ? undefined : scope.userId;
    if (!tenantId) throw new Error('tenant_context_required');

    return this.pool.transaction(async (tx) => {
      await tx.query('select set_config($1, $2, true)', ['app.tenant_id', tenantId]);
      if (userId) {
        await tx.query('select set_config($1, $2, true)', ['app.user_id', userId]);
      }
      return fn(tx);
    });
  }

  /**
   * Platform-wide tables only. Never for anything carrying tenant_id.
   * A dependency-cruiser rule plus tests/platform-scope.spec.ts enforce
   * that only PLATFORM_WIDE_TABLES appear inside these callbacks.
   */
  async withPlatform<T>(userId: string | null, fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.pool.transaction(async (tx) => {
      if (userId) {
        await tx.query('select set_config($1, $2, true)', ['app.user_id', userId]);
      }
      return fn(tx);
    });
  }

  /**
   * The one transaction that is allowed to create a tenant and its first
   * owner membership, before any tenant context can possibly exist.
   * Guarded in the database by the tenants_provisioning_insert policy.
   */
  async withProvisioning<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.pool.transaction(async (tx) => {
      await tx.query('select set_config($1, $2, true)', ['app.user_id', userId]);
      await tx.query('select set_config($1, $2, true)', ['app.provisioning', 'on']);
      return fn(tx);
    });
  }
}
