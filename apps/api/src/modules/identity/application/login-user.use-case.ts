import crypto from 'node:crypto';
import type { LoginRequest, LoginResponse } from '@platform/contracts';
import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { PasswordHasherPort, TokenServicePort } from './ports.js';
import { InvalidCredentialsError } from '../domain/errors.js';

export interface LoginOptions {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export class LoginUserUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly hasher: PasswordHasherPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(
    dto: LoginRequest,
    opts: LoginOptions = {},
  ): Promise<{ response: LoginResponse; refreshToken: string }> {
    return this.uow.withPlatform(null, async (tx) => {
      // 1. Find user and credentials
      const rows = await tx.query<{
        id: string;
        email: string;
        display_name: string;
        status: string;
        password_hash: string;
        failed_login_count: number;
        locked_until: Date | null;
      }>(
        `SELECT u.id, u.email, u.display_name, u.status,
                c.password_hash, c.failed_login_count, c.locked_until
           FROM users u
           JOIN user_credentials c ON c.user_id = u.id
          WHERE u.email = $1;`,
        [dto.email.toLowerCase().trim()],
      );

      const user = rows[0];
      if (!user) {
        throw new InvalidCredentialsError();
      }

      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        throw new InvalidCredentialsError();
      }

      // 2. Verify Password
      const isValid = await this.hasher.verify(dto.password, user.password_hash);
      if (!isValid) {
        await tx.query(
          `UPDATE user_credentials
              SET failed_login_count = failed_login_count + 1,
                  locked_until = CASE WHEN failed_login_count + 1 >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE NULL END
            WHERE user_id = $1;`,
          [user.id],
        );
        throw new InvalidCredentialsError();
      }

      // Reset failed logins on success
      if (user.failed_login_count > 0) {
        await tx.query(
          'UPDATE user_credentials SET failed_login_count = 0, locked_until = NULL WHERE user_id = $1;',
          [user.id],
        );
      }

      // 3. Find active memberships
      const memberships = await tx.query<{
        tenant_id: string;
        role: string;
      }>(
        `SELECT tenant_id, role
           FROM memberships
          WHERE user_id = $1 AND status = 'active';`,
        [user.id],
      );

      const firstTenant = memberships[0]?.tenant_id;

      // 4. Create Session and Refresh Token
      const sessionId = crypto.randomUUID();
      const rawRefreshToken = this.tokenService.generateOpaqueToken();
      const refreshTokenHash = this.tokenService.hashToken(rawRefreshToken);
      const refreshTokenId = crypto.randomUUID();

      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();

      await tx.query(
        `INSERT INTO sessions (
           id, user_id, current_refresh_token_id, status, user_agent, ip_address,
           created_at, last_active_at, expires_at
         ) VALUES ($1, $2, NULL, 'active', $3, $4, $5, $5, $6);`,
        [sessionId, user.id, opts.userAgent ?? null, opts.ipAddress ?? null, now, sessionExpiresAt],
      );

      await tx.query(
        `INSERT INTO session_refresh_tokens (
           id, session_id, token_hash, expires_at, created_at
         ) VALUES ($1, $2, $3, $4, $5);`,
        [refreshTokenId, sessionId, refreshTokenHash, refreshExpiresAt, now],
      );

      await tx.query(
        'UPDATE sessions SET current_refresh_token_id = $1 WHERE id = $2;',
        [refreshTokenId, sessionId],
      );

      // 5. Generate Access Token (15 mins)
      const accessToken = this.tokenService.generateAccessToken(
        {
          userId: user.id,
          email: user.email,
          sessionId,
          activeTenantId: firstTenant,
        },
        900,
      );

      return {
        response: {
          accessToken,
          expiresIn: 900,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
          },
          memberships: memberships.map((m) => ({
            tenantId: m.tenant_id,
            role: m.role,
          })),
        },
        refreshToken: rawRefreshToken,
      };
    });
  }
}
