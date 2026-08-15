export class EmailAlreadyUsedError extends Error {
  readonly code = 'identity.email_already_used';
  readonly status = 409;
  constructor(email: string) {
    super(`Email ${email} is already registered`);
  }
}

export class TenantSlugAlreadyUsedError extends Error {
  readonly code = 'identity.tenant_slug_already_used';
  readonly status = 409;
  constructor(slug: string) {
    super(`Tenant slug '${slug}' is already taken`);
  }
}

export class InvalidCredentialsError extends Error {
  readonly code = 'identity.invalid_credentials';
  readonly status = 401;
  constructor() {
    super('Invalid email or password');
  }
}

export class InvalidOrExpiredTokenError extends Error {
  readonly code = 'identity.invalid_or_expired_token';
  readonly status = 400;
  constructor() {
    super('Verification token is invalid or expired');
  }
}

export class SessionRevokedOrCompromisedError extends Error {
  readonly code = 'identity.session_compromised';
  readonly status = 401;
  constructor() {
    super('Session is invalid or compromised');
  }
}

export class UnauthorizedError extends Error {
  readonly code = 'auth.unauthorized';
  readonly status = 401;
  constructor(detail = 'Valid Bearer token required') {
    super(detail);
  }
}
