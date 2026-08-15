import crypto from 'node:crypto';
import type { TokenPayload, TokenServicePort } from '../application/ports.js';

export class CryptoTokenService implements TokenServicePort {
  constructor(private readonly secret: string) {}

  generateAccessToken(payload: TokenPayload, expiresInSec: number = 900): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Math.floor(Date.now() / 1000) + expiresInSec;
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, body, signature] = parts;

      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(`${header}.${body}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(Buffer.from(body!, 'base64url').toString('utf8'));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // expired
      }

      return {
        userId: payload.userId,
        email: payload.email,
        sessionId: payload.sessionId,
        activeTenantId: payload.activeTenantId,
      };
    } catch {
      return null;
    }
  }

  generateOpaqueToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
