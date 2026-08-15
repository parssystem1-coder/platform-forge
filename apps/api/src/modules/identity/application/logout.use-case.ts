import crypto from 'node:crypto';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { TokenServicePort } from './ports.js';
import { UnauthorizedError } from '../domain/errors.js';

export interface LogoutOptions {
  allDevices?: boolean;
}

export class LogoutUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tokenService: TokenServicePort,
  ) {}

  /**
   * Logout user. If refreshToken is provided, only that session is logged out.
   * If allDevices is true, all sessions for this user are logged out.
   */
  async execute(
    userId: string,
    rawRefreshToken?: string,
    opts: LogoutOptions = {},
  ): Promise<void> {
    return this.uow.withPlatform(null, async (tx) => {
      if (opts.allDevices) {
        // Revoke all sessions for this user
        await tx.query(
          `UPDATE sessions
              SET status = 'revoked', revoked_at = $1, revoke_reason = 'user_logout_all'
            WHERE user_id = $2 AND status = 'active';`,
          [new Date(), userId],
        );
        return;
      }

      if (!rawRefreshToken) {
        throw new UnauthorizedError('Refresh token required for single-session logout');
      }

      const tokenHash = this.tokenService.hashToken(rawRefreshToken);

      // Find the session for this token
      const rows = await tx.query<{ session_id: string }>(
        `SELECT t.session_id
           FROM session_refresh_tokens t
           JOIN sessions s ON s.id = t.session_id
          WHERE t.token_hash = $1 AND s.user_id = $2 AND s.status = 'active';`,
        [tokenHash, userId],
      );

      if (rows.length === 0) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const sessionId = rows[0]!.session_id;

      // Revoke this session
      await tx.query(
        `UPDATE sessions
            SET status = 'revoked', revoked_at = $1, revoke_reason = 'user_logout'
          WHERE id = $2;`,
        [new Date(), sessionId],
      );

      // Revoke all refresh tokens for this session (in case of token theft)
      await tx.query(
        'DELETE FROM session_refresh_tokens WHERE session_id = $1;',
        [sessionId],
      );
    });
  }
}
