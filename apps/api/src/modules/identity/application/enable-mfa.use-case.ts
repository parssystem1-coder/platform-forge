import crypto from 'node:crypto';
import { generateSecret } from '@otplib/core';
import { generateTOTP } from '@otplib/uri';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { TokenServicePort } from './ports.js';

// Initialize plugins
const cryptoPlugin = new NobleCryptoPlugin();
const base32Plugin = new ScureBase32Plugin();

export interface EnableMfaResult {
  secret: string;
  otpauthUri: string;
  backupCodes: string[];
}

export class EnableMfaUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(userId: string): Promise<EnableMfaResult> {
    return this.uow.withPlatform(null, async (tx) => {
      const now = new Date();

      // Check if MFA already enabled
      const existing = await tx.query<{ id: string }>(
        `SELECT id FROM mfa_totp_factors WHERE user_id = $1;`,
        [userId],
      );

      if (existing.length > 0) {
        throw new Error('MFA is already enabled');
      }

      // Generate TOTP secret
      const secret = generateSecret({
        crypto: cryptoPlugin,
        base32: base32Plugin,
      });

      // Generate OTPAuth URI for authenticator apps
      const otpauthUri = generateTOTP({
        issuer: 'PlatformForge',
        label: userId,
        secret,
      });

      // Generate backup codes (10 codes)
      const backupCodes: string[] = [];
      const backupCodeHashes: string[] = [];

      for (let i = 0; i < 10; i++) {
        const code = this.generateBackupCode();
        backupCodes.push(code);
        backupCodeHashes.push(this.tokenService.hashToken(code));
      }

      // Store secret (in production, encrypt this)
      const factorId = crypto.randomUUID();
      const encryptedSecret = Buffer.from(secret, 'utf8');

      await tx.query(
        `INSERT INTO mfa_totp_factors (
           id, user_id, secret_ciphertext, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5);`,
        [factorId, userId, encryptedSecret, now, now],
      );

      // Store backup codes
      for (const codeHash of backupCodeHashes) {
        await tx.query(
          `INSERT INTO mfa_recovery_codes (
             id, user_id, code_hash, created_at
           ) VALUES ($1, $2, $3, $4);`,
          [crypto.randomUUID(), userId, codeHash, now],
        );
      }

      // Emit event
      const outboxEventId = crypto.randomUUID();
      await tx.query(
        `INSERT INTO outbox_events (
           id, event_type, event_version, aggregate_type, aggregate_id,
           tenant_id, payload, correlation_id, occurred_at, status
         ) VALUES ($1, $2, 1, 'user', $3, NULL, $4, $5, $6, 'pending');`,
        [
          outboxEventId,
          'identity.mfa_enrollment_started',
          userId,
          JSON.stringify({ userId, factorId }),
          crypto.randomUUID(),
          now,
        ],
      );

      return {
        secret,
        otpauthUri,
        backupCodes,
      };
    });
  }

  private generateBackupCode(): string {
    // Format: XXXX-XXXX-XXXX (alphanumeric)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) {
        code += '-';
      }
      code += chars[crypto.randomInt(chars.length)];
    }
    return code;
  }
}
