export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  tenantSlug: string;
  tenantName: string;
}

export interface RegisterResponse {
  userId: string;
  tenantId: string;
  status: 'pending_verification' | 'active';
}

export interface LoginRequest {
  email: string;
  password: string;
  totpCode?: string | undefined;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  memberships: Array<{
    tenantId: string;
    role: string;
  }>;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}
