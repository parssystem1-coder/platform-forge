import type { UnitOfWork } from '../../../kernel/unit-of-work.js';
import type { TokenServicePort } from './ports.js';
import { InvalidOrExpiredTokenError } from '../domain/errors.js';

export class VerifyEmailUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(rawToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(rawToken);

    return this.uow.withPlatform(null, async (tx) => {
      const rows = await tx.query<{
        id: string;
        user_id: string;
        expires_at: Date;
        consumed_at: Date | null;
      }>(
        `SELECT id, user_id, expires_at, consumed_at
           FROM email_verification_tokens
          WHERE token_hash = $1;`,
        [tokenHash],
      );

      const record = rows[0];
      if (!record || record.consumed_at || new Date(record.expires_at) < new Date()) {
        throw new InvalidOrExpiredTokenError();
      }

      const now = new Date();
      await tx.query(
        'UPDATE email_verification_tokens SET consumed_at = $1 WHERE id = $2;',
        [now, record.id],
      );

      await tx.query(
        `UPDATE users
            SET email_verified_at = $1, status = 'active', updated_at = $1
          WHERE id = $2;`,
        [now, record.user_id],
      );
    });
  }
}
