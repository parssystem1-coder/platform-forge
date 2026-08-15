import crypto from 'node:crypto';
import type { RefreshResponse } from '@platform/contracts';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { TokenServicePort } from './ports.js';
import { SessionRevokedOrCompromisedError } from '../domain/errors.js';

export class RefreshTokenUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(
    rawRefreshToken: string,
  ): Promise<{ response: RefreshResponse; newRefreshToken: string }> {
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);

    return this.uow.withPlatform(null, async (tx) => {
      // 1. Look up token and associated session
      const rows = await tx.query<{
        token_id: string;
        session_id: string;
        token_expires_at: Date;
        session_status: string;
        session_expires_at: Date;
        user_id: string;
        user_email: string;
      }>(
        `SELECT t.id AS token_id, t.session_id, t.expires_at AS token_expires_at,
                s.status AS session_status, s.expires_at AS session_expires_at,
                u.id AS user_id, u.email AS user_email
           FROM session_refresh_tokens t
           JOIN sessions s ON s.id = t.session_id
           JOIN users u ON u.id = s.user_id
          WHERE t.token_hash = $1;`,
        [tokenHash],
      );

      const record = rows[0];
      if (
        !record ||
        record.session_status !== 'active' ||
        new Date(record.token_expires_at) < new Date() ||
        new Date(record.session_expires_at) < new Date()
      ) {
        throw new SessionRevokedOrCompromisedError();
      }

      // 2. Rotate Refresh Token
      const newRawRefreshToken = this.tokenService.generateOpaqueToken();
      const newRefreshTokenHash = this.tokenService.hashToken(newRawRefreshToken);
      const newRefreshTokenId = crypto.randomUUID();
      const now = new Date();
      const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Invalidate old refresh token and insert new one
      await tx.query('DELETE FROM session_refresh_tokens WHERE id = $1;', [record.token_id]);

      await tx.query(
        `INSERT INTO session_refresh_tokens (
           id, session_id, token_hash, expires_at, created_at
         ) VALUES ($1, $2, $3, $4, $5);`,
        [newRefreshTokenId, record.session_id, newRefreshTokenHash, refreshExpiresAt, now],
      );

      await tx.query(
        'UPDATE sessions SET current_refresh_token_id = $1, last_active_at = $2 WHERE id = $3;',
        [newRefreshTokenId, now, record.session_id],
      );

      // 3. Issue new Access Token
      const accessToken = this.tokenService.generateAccessToken(
        {
          userId: record.user_id,
          email: record.user_email,
          sessionId: record.session_id,
        },
        900,
      );

      return {
        response: {
          accessToken,
          expiresIn: 900,
        },
        newRefreshToken: newRawRefreshToken,
      };
    });
  }
}
