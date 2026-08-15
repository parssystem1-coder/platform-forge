import type { User, Membership, Session } from '@platform/contracts';

export interface PasswordHasherPort {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export interface TokenPayload {
  userId: string;
  email: string;
  sessionId: string;
  activeTenantId?: string | undefined;
}

export interface TokenServicePort {
  generateAccessToken(payload: TokenPayload, expiresInSec?: number): string;
  verifyAccessToken(token: string): TokenPayload | null;
  generateOpaqueToken(): string;
  hashToken(token: string): string;
}

export interface UserWithCredentials {
  user: User;
  passwordHash: string;
  failedLoginCount: number;
  lockedUntil: Date | null;
}

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<UserWithCredentials | null>;
  findById(userId: string): Promise<User | null>;
  findMemberships(userId: string): Promise<Array<Membership & { tenantSlug: string; tenantName: string }>>;
}

export interface SessionRepositoryPort {
  createSession(session: Omit<Session, 'id'> & { id?: string }): Promise<Session>;
  findSession(sessionId: string): Promise<Session | null>;
  revokeSession(sessionId: string): Promise<void>;
}
