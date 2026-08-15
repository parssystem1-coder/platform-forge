import crypto from 'node:crypto';
import { verify } from '@otplib/totp';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { TokenServicePort } from './ports.js';
import { InvalidCredentialsError } from '../domain/errors.js';

// Initialize plugins
const cryptoPlugin = new NobleCryptoPlugin();

export interface VerifyMfaResult {
  success: boolean;
  remainingBackupCodes: number;
}

export class VerifyMfaUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tokenService: TokenServicePort,
  ) {}

  /**
   * Verify MFA code and mark the factor as verified.
   * Also supports backup code verification.
   */
  async execute(
    userId: string,
    code: string,
  ): Promise<VerifyMfaResult> {
    return this.uow.withPlatform(null, async (tx) => {
      const now = new Date();

      // Find active MFA factor
      const factors = await tx.query<{
        id: string;
        secret_ciphertext: Buffer;
      }>(
        `SELECT id, secret_ciphertext
           FROM mfa_totp_factors
          WHERE user_id = $1;`,
        [userId],
      );

      if (factors.length === 0) {
        throw new InvalidCredentialsError();
      }

      const factor = factors[0]!;

      // First, check if it's a backup code
      const codeHash = this.tokenService.hashToken(code.toUpperCase());
      const backupCodes = await tx.query<{ id: string }>(
        `SELECT id FROM mfa_recovery_codes
          WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL;`,
        [userId, codeHash],
      );

      if (backupCodes.length > 0) {
        // Mark backup code as used
        await tx.query(
          'UPDATE mfa_recovery_codes SET used_at = $1 WHERE id = $2;',
          [now, backupCodes[0]!.id],
        );

        // Count remaining backup codes
        const remaining = await tx.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM mfa_recovery_codes
            WHERE user_id = $1 AND used_at IS NULL;`,
          [userId],
        );

        const remainingCount = parseInt(remaining[0]!.count);

        if (remainingCount === 0) {
          // No more backup codes - disable MFA
          await tx.query('DELETE FROM mfa_totp_factors WHERE user_id = $1;', [userId]);
        }

        return {
          success: true,
          remainingBackupCodes: remainingCount,
        };
      }

      // Verify TOTP code using otplib
      const secret = factor.secret_ciphertext.toString('utf8');

      // otplib's verify function handles time drift tolerance
      const result = await verify({
        secret,
        token: code,
        crypto: cryptoPlugin,
        epochTolerance: 30, // Allow 30 seconds tolerance for clock drift
      });

      if (!result.valid) {
        throw new InvalidCredentialsError();
      }

      // Mark factor as verified (if not already verified)
      if (!factor.id) {
        throw new InvalidCredentialsError();
      }

      await tx.query(
        `UPDATE mfa_totp_factors
            SET verified_at = $1, updated_at = $1
          WHERE id = $2;`,
        [now, factor.id],
      );

      // Count remaining backup codes
      const remaining = await tx.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM mfa_recovery_codes
          WHERE user_id = $1 AND used_at IS NULL;`,
        [userId],
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
          'identity.mfa_enabled',
          userId,
          JSON.stringify({ userId, factorId: factor.id }),
          crypto.randomUUID(),
          now,
        ],
      );

      return {
        success: true,
        remainingBackupCodes: parseInt(remaining[0]!.count),
      };
    });
  }
}
