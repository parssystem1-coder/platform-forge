import crypto from 'node:crypto';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { TokenServicePort } from './ports.js';

export interface RequestPasswordResetResult {
  /**
   * Whether a reset token was created.
   * Returns false if the email doesn't exist (to prevent email enumeration).
   */
  sent: boolean;
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tokenService: TokenServicePort,
  ) {}

  /**
   * Request password reset. Always returns {sent: true} for security
   * (prevents email enumeration attacks).
   */
  async execute(email: string): Promise<RequestPasswordResetResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const tokenRecordId = crypto.randomUUID();
    const outboxEventId = crypto.randomUUID();
    const now = new Date();

    return this.uow.withPlatform(null, async (tx) => {
      // Find user by email (always succeeds from attacker's perspective)
      const userRows = await tx.query<{ id: string }>(
        'SELECT id FROM users WHERE email = $1;',
        [normalizedEmail],
      );

      // Always return success to prevent email enumeration
      // (even if user doesn't exist, we pretend we sent an email)
      if (userRows.length === 0) {
        return { sent: true };
      }

      const userId = userRows[0]!.id;

      // Invalidate any existing reset tokens for this user
      await tx.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1;',
        [userId],
      );

      // Generate reset token
      const rawResetToken = this.tokenService.generateOpaqueToken();
      const tokenHash = this.tokenService.hashToken(rawResetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store hashed token
      await tx.query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5);`,
        [tokenRecordId, userId, tokenHash, expiresAt, now],
      );

      // Emit event for email sending (via outbox)
      await tx.query(
        `INSERT INTO outbox_events (
           id, event_type, event_version, aggregate_type, aggregate_id,
           tenant_id, payload, correlation_id, occurred_at, status
         ) VALUES ($1, $2, 1, 'user', $3, NULL, $4, $5, $6, 'pending');`,
        [
          outboxEventId,
          'identity.password_reset_requested',
          userId,
          JSON.stringify({
            userId,
            email: normalizedEmail,
            resetToken: rawResetToken, // In production, this would be sent via email
            expiresAt,
          }),
          crypto.randomUUID(),
          now,
        ],
      );

      return { sent: true };
    });
  }
}
