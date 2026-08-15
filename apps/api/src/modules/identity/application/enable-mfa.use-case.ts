import crypto from 'node:crypto';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { TokenServicePort } from './ports.js';

/**
 * TOTP implementation per RFC 6238
 * In production, use a library like otplib or speakeasy
 */
function generateTOTPSecret(): { secret: string; uri: string } {
  const secretBytes = crypto.randomBytes(20);
  const secret = secretBytes.toString('base64');
  // In production, this URI would be used to generate a QR code
  const uri = `otpauth://totp/Platform:${encodeURIComponent(secret)}?secret=${secret}&algorithm=SHA1&digits=6&period=30`;
  return { secret, uri };
}

function generateTOTPCode(secret: string): string {
  // Simplified TOTP - in production use otplib
  const counter = Math.floor(Date.now() / 30000);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base64'));
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  const lastByte = hash[hash.length - 1]!;
  const offset = lastByte & 0x0f;
  const b0 = hash[offset]!;
  const b1 = hash[offset + 1]!;
  const b2 = hash[offset + 2]!;
  const b3 = hash[offset + 3]!;

  const code =
    ((b0 & 0x7f) << 24) |
    ((b1 & 0xff) << 16) |
    ((b2 & 0xff) << 8) |
    (b3 & 0xff);

  const otp = code % 1000000;
  return otp.toString().padStart(6, '0');
}

export interface EnableMfaResult {
  secret: string;
  uri: string;
  backupCodes: string[];
  testCode: string;
}

export class EnableMfaUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(userId: string): Promise<EnableMfaResult> {
    const factorId = crypto.randomUUID();
    const now = new Date();

    return this.uow.withPlatform(null, async (tx) => {
      // Check if MFA is already enabled
      const existingFactors = await tx.query<{ id: string }>(
        `SELECT id FROM mfa_totp_factors WHERE user_id = $1 AND verified_at IS NOT NULL;`,
        [userId],
      );

      if (existingFactors.length > 0) {
        throw new Error('MFA is already enabled for this user');
      }

      // Generate TOTP secret
      const { secret, uri } = generateTOTPSecret();

      // Generate backup codes (8 one-time codes)
      const backupCodes: string[] = [];
      for (let i = 0; i < 8; i++) {
        const code = crypto.randomBytes(8).toString('hex').toUpperCase();
        backupCodes.push(code);
        const backupCodeHash = this.tokenService.hashToken(code);

        const backupId = crypto.randomUUID();
        await tx.query(
          `INSERT INTO mfa_recovery_codes (id, user_id, code_hash, used_at, created_at)
           VALUES ($1, $2, $3, NULL, $4);`,
          [backupId, userId, backupCodeHash, now],
        );
      }

      // Store TOTP factor (not verified yet - user must verify first code)
      // The secret should be encrypted in production
      await tx.query(
        `INSERT INTO mfa_totp_factors (id, user_id, secret_ciphertext, secret_key_version, label, verified_at, created_at, updated_at)
         VALUES ($1, $2, $3, 'v1', 'Authenticator App', NULL, $4, $4);`,
        [factorId, userId, Buffer.from(secret, 'utf8'), now],
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
          'identity.mfa_setup_initiated',
          userId,
          JSON.stringify({ userId, factorId }),
          crypto.randomUUID(),
          now,
        ],
      );

      // Generate a test code for verification
      const testCode = generateTOTPCode(secret);

      return {
        secret,
        uri,
        backupCodes,
        testCode,
      };
    });
  }
}
