import crypto from 'node:crypto';
import type { RegisterRequest, RegisterResponse } from '@platform/contracts';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { PasswordHasherPort, TokenServicePort } from './ports.js';
import { EmailAlreadyUsedError, TenantSlugAlreadyUsedError } from '../domain/errors.js';

export class RegisterUserUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly hasher: PasswordHasherPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(dto: RegisterRequest): Promise<RegisterResponse> {
    const userId = crypto.randomUUID();
    const tenantId = crypto.randomUUID();
    const membershipId = crypto.randomUUID();
    const tokenRecordId = crypto.randomUUID();
    const outboxEventId = crypto.randomUUID();

    const passwordHash = await this.hasher.hash(dto.password);
    const rawVerificationToken = this.tokenService.generateOpaqueToken();
    const tokenHash = this.tokenService.hashToken(rawVerificationToken);

    return this.uow.withProvisioning(userId, async (tx) => {
      // 1. Check email uniqueness
      const existingUser = await tx.query<{ id: string }>(
        'SELECT id FROM users WHERE email = $1;',
        [dto.email.toLowerCase().trim()],
      );
      if (existingUser.length > 0) {
        throw new EmailAlreadyUsedError(dto.email);
      }

      // 2. Check tenant slug uniqueness
      const existingTenant = await tx.query<{ id: string }>(
        'SELECT id FROM tenants WHERE slug = $1;',
        [dto.tenantSlug.toLowerCase().trim()],
      );
      if (existingTenant.length > 0) {
        throw new TenantSlugAlreadyUsedError(dto.tenantSlug);
      }

      const now = new Date();

      // 3. Insert User
      await tx.query(
        `INSERT INTO users (id, email, display_name, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'pending_verification', $4, $4);`,
        [userId, dto.email.toLowerCase().trim(), dto.displayName, now],
      );

      // 4. Insert Credentials
      await tx.query(
        `INSERT INTO user_credentials (user_id, password_hash, password_changed_at, failed_login_count, created_at, updated_at)
         VALUES ($1, $2, $4, 0, $4, $4);`,
        [userId, passwordHash, 0, now],
      );

      // 5. Insert Tenant
      await tx.query(
        `INSERT INTO tenants (id, slug, name, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', $4, $4);`,
        [tenantId, dto.tenantSlug.toLowerCase().trim(), dto.tenantName, now],
      );

      // 6. Insert Owner Membership
      await tx.query(
        `INSERT INTO memberships (id, tenant_id, user_id, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'owner', 'active', $4, $4);`,
        [membershipId, tenantId, userId, now],
      );

      // 7. Insert Verification Token (expires in 24 hours)
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await tx.query(
        `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5);`,
        [tokenRecordId, userId, tokenHash, tokenExpiresAt, now],
      );

      // 8. Insert Outbox Event: identity.user_registered
      await tx.query(
        `INSERT INTO outbox_events (
           id, event_type, event_version, aggregate_type, aggregate_id,
           tenant_id, payload, correlation_id, occurred_at, status
         ) VALUES ($1, $2, 1, 'user', $3, NULL, $4, $5, $6, 'pending');`,
        [
          outboxEventId,
          'identity.user_registered',
          userId,
          JSON.stringify({
            userId,
            email: dto.email,
            displayName: dto.displayName,
            tenantId,
            verificationToken: rawVerificationToken,
          }),
          crypto.randomUUID(),
          now,
        ],
      );

      return {
        userId,
        tenantId,
        status: 'pending_verification',
      };
    });
  }
}
