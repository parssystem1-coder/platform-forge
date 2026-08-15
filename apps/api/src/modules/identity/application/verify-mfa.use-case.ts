import crypto from 'node:crypto';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { TokenServicePort } from './ports.js';
import { InvalidCredentialsError } from '../domain/errors.js';

/**
 * TOTP verification per RFC 6238
 */
function verifyTOTP(secret: string, code: string): boolean {
  // Simplified TOTP verification - in production use otplib
  const counter = Math.floor(Date.now() / 30000);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'utf8'));
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  const lastByte = hash[hash.length - 1]!;
  const offset = lastByte & 0x0f;
  const b0 = hash[offset]!;
  const b1 = hash[offset + 1]!;
  const b2 = hash[offset + 2]!;
  const b3 = hash[offset + 3]!;

  const codeNum =
    ((b0 & 0x7f) << 24) |
    ((b1 & 0xff) << 16) |
    ((b2 & 0xff) << 8) |
    (b3 & 0xff);

  const expectedOTP = codeNum % 1000000;
  const expected = expectedOTP.toString().padStart(6, '0');

  // Also check previous and next counters (clock drift tolerance)
  for (let offset2 = -1; offset2 <= 1; offset2++) {
    const counter2 = counter + offset2;
    const counterBuffer2 = Buffer.alloc(8);
    counterBuffer2.writeBigInt64BE(BigInt(counter2));

    const hmac2 = crypto.createHmac('sha1', Buffer.from(secret, 'utf8'));
    hmac2.update(counterBuffer2);
    const hash2 = hmac2.digest();

    const lastByte2 = hash2[hash2.length - 1]!;
    const offset3 = lastByte2 & 0x0f;
    const c0 = hash2[offset3]!;
    const c1 = hash2[offset3 + 1]!;
    const c2 = hash2[offset3 + 2]!;
    const c3 = hash2[offset3 + 3]!;

    const codeNum2 =
      ((c0 & 0x7f) << 24) |
      ((c1 & 0xff) << 16) |
      ((c2 & 0xff) << 8) |
      (c3 & 0xff);

    const expected2 = (codeNum2 % 1000000).toString().padStart(6, '0');
    if (expected2 === code) return true;
  }

  return false;
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
  ): Promise<{ success: boolean; remainingBackupCodes: number }> {
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

        // If this was the last backup code, throw error
        const remaining = await tx.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM mfa_recovery_codes
            WHERE user_id = $1 AND used_at IS NULL;`,
          [userId],
        );

        if (parseInt(remaining[0]!.count) === 0) {
          // No more backup codes - disable MFA
          await tx.query('DELETE FROM mfa_totp_factors WHERE user_id = $1;', [userId]);
        }

        return {
          success: true,
          remainingBackupCodes: parseInt(remaining[0]!.count),
        };
      }

      // Verify TOTP code
      const secret = factor.secret_ciphertext.toString('utf8');
      const isValid = verifyTOTP(secret, code);

      if (!isValid) {
        throw new InvalidCredentialsError();
      }

      // Mark factor as verified
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
