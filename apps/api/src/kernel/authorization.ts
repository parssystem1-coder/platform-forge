/**
 * The single decision point for access control.
 *
 * Rule: no file outside this module may compare roles directly.
 * CI enforces it. If you need a new check, add it here, not in a controller.
 *
 * AMENDMENT v3 changes, all of them findings from the audit:
 *   F-015  the machine-client branch fell through to `if (!actor.userId)`
 *          and therefore denied every API key that ever existed.
 *   F-029  customers were hard-denied, which left the storefront no legal
 *          path and guaranteed it would bypass authorize() entirely.
 *          Added authorizeCustomer(), ownership-based, same module.
 *   F-030  staff had no path at all, so the Platform Admin realm, one of
 *          the four pillars of the identity model, was unimplementable.
 *   F-022  quota was checked here with a read (assertAvailable), which is
 *          exactly the read-then-write race the handbook forbids.
 *          Quota now returns an intent; the use case reserves atomically.
 */
import type {
  ActorContext,
  ActorKind,
  AuthorizeOptions,
  AuthorizationResult,
  PermissionKey,
} from '@platform/contracts';

export class Forbidden extends Error {
  readonly code = 'authz.forbidden';
  readonly status = 403;
}

export class FeatureNotAvailable extends Error {
  readonly code = 'billing.feature_not_available';
  readonly status = 402;
  constructor(readonly featureKey: string) {
    super('feature not available: ' + featureKey);
  }
}

export class MembershipNotFound extends Error {
  readonly code = 'tenancy.membership_not_found';
  readonly status = 403;
}

export class InvalidTenantContext extends Error {
  readonly code = 'tenancy.invalid_tenant_context';
  readonly status = 400;
}

export class NotResourceOwner extends Error {
  readonly code = 'authz.not_resource_owner';
  readonly status = 403;
}

export interface MembershipReader {
  findActive(userId: string, tenantId: string): Promise<{ role: string } | null>;
}

export interface RoleRegistry {
  permissionsOf(role: string): ReadonlySet<PermissionKey>;
}

export interface FeatureResolver {
  isEnabled(tenantId: string, featureKey: string): Promise<boolean>;
}

/** Ownership lookup for the storefront customer realm. */
export interface OwnershipReader {
  ownsResource(
    tenantId: string,
    customerId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<boolean>;
}

export interface AuditWriter {
  record(entry: {
    action: string;
    actorKind: ActorKind;
    actorId?: string | undefined;
    tenantId?: string | undefined;
    impersonatedBy?: string | undefined;
    correlationId: string;
    metadata?: Record<string, unknown> | undefined;
  }): Promise<void>;
}

/**
 * Phase 1: FeatureResolver reads a config file.
 * Phase 6: only that implementation changes. Every call site stays
 * identical. That is what future-ready actually means.
 */
export class AuthorizationService {
  constructor(
    private readonly memberships: MembershipReader,
    private readonly roles: RoleRegistry,
    private readonly features: FeatureResolver,
    private readonly ownership: OwnershipReader,
    private readonly audit: AuditWriter,
    private readonly featureByPermission: Record<PermissionKey, string | undefined>,
    private readonly quotaByPermission: Record<PermissionKey, string | undefined>,
  ) {}

  /**
   * Tenant users, platform staff and machine clients.
   * Customers go through authorizeCustomer().
   */
  async authorize(
    actor: ActorContext,
    permission: PermissionKey,
    resource: { tenantId: string },
    opts: AuthorizeOptions = {},
  ): Promise<AuthorizationResult> {
    const quantity = opts.quantity ?? 1;

    if (actor.kind === 'customer') {
      // A customer never holds a platform permission. Calling this with a
      // customer actor is a programming error, not an authz decision.
      throw new Forbidden();
    }

    // ----- Platform staff: cross-tenant by design, audited always -------
    if (actor.kind === 'staff') {
      if (!actor.staffId) throw new Forbidden();
      const granted = actor.staffPermissions ?? [];
      if (!granted.includes(permission) && !granted.includes('platform.*')) {
        throw new Forbidden();
      }
      // Staff access to tenant data is always recorded. No exceptions.
      await this.audit.record({
        action: 'staff.access',
        actorKind: 'staff',
        actorId: actor.staffId,
        tenantId: resource.tenantId,
        impersonatedBy: actor.impersonatedBy,
        correlationId: actor.correlationId,
        metadata: { permission },
      });
      return { actorKind: 'staff', tenantId: resource.tenantId, quantity };
    }

    if (!actor.tenantId || actor.tenantId !== resource.tenantId) {
      throw new InvalidTenantContext();
    }

    // ----- Machine clients: scope based, then feature gate --------------
    if (actor.kind === 'machine') {
      if (!actor.clientId) throw new Forbidden();
      const scopes = actor.scopes ?? [];
      if (!scopes.includes(permission)) throw new Forbidden();
      await this.assertFeature(resource.tenantId, permission);
      // F-015: this return is the fix. Without it, execution fell through
      // to the userId check below and every machine client was denied.
      return {
        actorKind: 'machine',
        tenantId: resource.tenantId,
        quotaKey: this.quotaByPermission[permission],
        quantity,
      };
    }

    // ----- Tenant users -------------------------------------------------
    if (!actor.userId) throw new Forbidden();

    const membership = await this.memberships.findActive(actor.userId, resource.tenantId);
    if (!membership) throw new MembershipNotFound();

    if (!this.roles.permissionsOf(membership.role).has(permission)) {
      throw new Forbidden();
    }

    await this.assertFeature(resource.tenantId, permission);

    // F-022: no read-then-write quota check here. We hand the key back and
    // the use case reserves it atomically in its own transaction.
    return {
      actorKind: 'user',
      tenantId: resource.tenantId,
      quotaKey: this.quotaByPermission[permission],
      quantity,
    };
  }

  /**
   * F-029: the storefront realm. A shopper has no permissions and no
   * membership; the only question that matters is whether the resource
   * belongs to them, inside the right tenant.
   *
   * Guest access is expressed as a signed cart/order token resolved to a
   * customerId upstream, so this function never needs a "guest" branch.
   */
  async authorizeCustomer(
    actor: ActorContext,
    action: string,
    resource: { tenantId: string; type: string; id: string },
  ): Promise<AuthorizationResult> {
    if (actor.kind !== 'customer' || !actor.customerId) throw new Forbidden();
    if (!actor.tenantId || actor.tenantId !== resource.tenantId) {
      throw new InvalidTenantContext();
    }

    const owns = await this.ownership.ownsResource(
      resource.tenantId,
      actor.customerId,
      resource.type,
      resource.id,
    );
    if (!owns) throw new NotResourceOwner();

    return { actorKind: 'customer', tenantId: resource.tenantId, quantity: 1 };
  }

  private async assertFeature(tenantId: string, permission: PermissionKey): Promise<void> {
    const featureKey = this.featureByPermission[permission];
    if (!featureKey) return;
    const enabled = await this.features.isEnabled(tenantId, featureKey);
    if (!enabled) throw new FeatureNotAvailable(featureKey);
  }
}
