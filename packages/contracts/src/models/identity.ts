export type UserStatus = 'pending_verification' | 'active' | 'suspended';

export interface User {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  phone: string | null;
  phoneVerifiedAt: Date | null;
  displayName: string;
  avatarUrl: string | null;
  locale: string;
  timezone: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentials {
  userId: string;
  passwordHash: string;
  passwordChangedAt: Date;
  failedLoginCount: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SessionStatus = 'active' | 'revoked' | 'compromised' | 'expired';

export interface Session {
  id: string;
  userId: string;
  currentRefreshTokenId: string | null;
  status: SessionStatus;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
}
