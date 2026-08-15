import crypto from 'node:crypto';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { PasswordHasherPort, TokenServicePort } from './ports.js';
import { InvalidOrExpiredTokenError } from '../domain/errors.js';

export class ResetPasswordUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly hasher: PasswordHasherPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(rawToken);
    const now = new Date();

    return this.uow.withPlatform(null, async (tx) => {
      // Find valid reset token
      const rows = await tx.query<{
        id: string;
        user_id: string;
        expires_at: Date;
        consumed_at: Date | null;
      }>(
        `SELECT id, user_id, expires_at, consumed_at
           FROM password_reset_tokens
          WHERE token_hash = $1;`,
        [tokenHash],
      );

      const record = rows[0];
      if (!record || record.consumed_at || new Date(record.expires_at) < now) {
        throw new InvalidOrExpiredTokenError();
      }

      // Mark token as consumed
      await tx.query(
        'UPDATE password_reset_tokens SET consumed_at = $1 WHERE id = $2;',
        [now, record.id],
      );

      // Hash new password
      const passwordHash = await this.hasher.hash(newPassword);

      // Update user credentials
      await tx.query(
        `UPDATE user_credentials
            SET password_hash = $1, password_changed_at = $2, updated_at = $2,
                failed_login_count = 0, locked_until = NULL
          WHERE user_id = $3;`,
        [passwordHash, now, record.user_id],
      );

      // Emit event
      const outboxEventId = crypto.randomUUID();
      await tx.query(
        `INSERT INTO outbox_events (
           id, event_type, event_version, aggregate_type, aggregate_id,
           tenant_id, payload, correlation_id, occurred_at, status
         ) VALUES ($1, $2, 1, 'user', $3, NULL, $4, $5, $6, 'pending');`,
        [
          outboxEventId,
          'identity.password_reset_completed',
          record.user_id,
          JSON.stringify({ userId: record.user_id }),
          crypto.randomUUID(),
          now,
        ],
      );
    });
  }
}
