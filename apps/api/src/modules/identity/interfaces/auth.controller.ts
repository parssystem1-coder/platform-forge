import type { FastifyPluginAsync } from 'fastify';
import type { RegisterUserUseCase } from '../application/register-user.use-case.js';
import type { LoginUserUseCase } from '../application/login-user.use-case.js';
import type { VerifyEmailUseCase } from '../application/verify-email.use-case.js';
import type { RefreshTokenUseCase } from '../application/refresh-token.use-case.js';
import type { LogoutUseCase } from '../application/logout.use-case.js';
import type { RequestPasswordResetUseCase } from '../application/request-password-reset.use-case.js';
import type { ResetPasswordUseCase } from '../application/reset-password.use-case.js';
import type { EnableMfaUseCase } from '../application/enable-mfa.use-case.js';
import type { VerifyMfaUseCase } from '../application/verify-mfa.use-case.js';
import type { RegisterRequest, LoginRequest } from '@platform/contracts';

export interface AuthControllerOptions {
  registerUseCase: RegisterUserUseCase;
  loginUseCase: LoginUserUseCase;
  verifyEmailUseCase: VerifyEmailUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
  logoutUseCase: LogoutUseCase;
  requestPasswordResetUseCase: RequestPasswordResetUseCase;
  resetPasswordUseCase: ResetPasswordUseCase;
  enableMfaUseCase: EnableMfaUseCase;
  verifyMfaUseCase: VerifyMfaUseCase;
}

export const authRoutes: FastifyPluginAsync<AuthControllerOptions> = async (fastify, opts) => {
  // 1. POST /api/v1/auth/register
  fastify.post<{ Body: RegisterRequest }>('/api/v1/auth/register', async (request, reply) => {
    const { email, password, displayName, tenantSlug, tenantName } = request.body || {};
    if (!email || !password || !displayName || !tenantSlug || !tenantName) {
      return reply.status(422).send({
        type: 'https://errors.platform.example/validation.invalid_input',
        title: 'Validation Failed',
        status: 422,
        code: 'validation.invalid_input',
        detail: 'email, password, displayName, tenantSlug, and tenantName are required',
      });
    }

    const result = await opts.registerUseCase.execute(request.body);
    return reply.status(201).send(result);
  });

  // 2. POST /api/v1/auth/login
  fastify.post<{ Body: LoginRequest }>('/api/v1/auth/login', async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.status(422).send({
        type: 'https://errors.platform.example/validation.invalid_input',
        title: 'Validation Failed',
        status: 422,
        code: 'validation.invalid_input',
        detail: 'email and password are required',
      });
    }

    const { response, refreshToken } = await opts.loginUseCase.execute(request.body, {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    reply.setCookie('platform_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return reply.status(200).send(response);
  });

  // 3. POST /api/v1/auth/verify-email
  fastify.post<{ Body: { token: string } }>('/api/v1/auth/verify-email', async (request, reply) => {
    const { token } = request.body || {};
    if (!token) {
      return reply.status(400).send({
        type: 'https://errors.platform.example/validation.invalid_input',
        title: 'Validation Failed',
        status: 400,
        code: 'validation.invalid_input',
        detail: 'token is required',
      });
    }

    await opts.verifyEmailUseCase.execute(token);
    return reply.status(204).send();
  });

  // 4. POST /api/v1/auth/refresh
  fastify.post('/api/v1/auth/refresh', async (request, reply) => {
    const refreshToken =
      request.cookies['platform_refresh_token'] ||
      (request.body as { refreshToken?: string })?.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({
        type: 'https://errors.platform.example/identity.session_compromised',
        title: 'Unauthorized',
        status: 401,
        code: 'identity.session_compromised',
        detail: 'Refresh token cookie is missing',
      });
    }

    const { response, newRefreshToken } = await opts.refreshTokenUseCase.execute(refreshToken);

    reply.setCookie('platform_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60,
    });

    return reply.status(200).send(response);
  });

  // 5. POST /api/v1/auth/logout
  fastify.post('/api/v1/auth/logout', async (request, reply) => {
    // Get user ID from access token (set by auth middleware)
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply.status(401).send({
        type: 'https://errors.platform.example/auth.unauthorized',
        title: 'Unauthorized',
        status: 401,
        code: 'auth.unauthorized',
        detail: 'Valid Bearer token required',
      });
    }

    const refreshToken = request.cookies['platform_refresh_token'];
    const allDevices = (request.body as { allDevices?: boolean })?.allDevices ?? false;

    await opts.logoutUseCase.execute(userId, refreshToken, { allDevices });

    // Clear refresh token cookie
    reply.clearCookie('platform_refresh_token', { path: '/api/v1/auth' });

    return reply.status(204).send();
  });

  // 6. POST /api/v1/auth/request-password-reset
  fastify.post<{ Body: { email: string } }>('/api/v1/auth/request-password-reset', async (request, reply) => {
    const { email } = request.body || {};
    if (!email) {
      return reply.status(422).send({
        type: 'https://errors.platform.example/validation.invalid_input',
        title: 'Validation Failed',
        status: 422,
        code: 'validation.invalid_input',
        detail: 'email is required',
      });
    }

    // Always return 200 to prevent email enumeration
    await opts.requestPasswordResetUseCase.execute(email);
    return reply.status(200).send({ message: 'If an account exists with this email, a password reset link has been sent.' });
  });

  // 7. POST /api/v1/auth/reset-password
  fastify.post<{ Body: { token: string; newPassword: string } }>('/api/v1/auth/reset-password', async (request, reply) => {
    const { token, newPassword } = request.body || {};
    if (!token || !newPassword) {
      return reply.status(422).send({
        type: 'https://errors.platform.example/validation.invalid_input',
        title: 'Validation Failed',
        status: 422,
        code: 'validation.invalid_input',
        detail: 'token and newPassword are required',
      });
    }

    // Basic password strength check
    if (newPassword.length < 8) {
      return reply.status(422).send({
        type: 'https://errors.platform.example/identity.weak_password',
        title: 'Weak Password',
        status: 422,
        code: 'identity.weak_password',
        detail: 'Password must be at least 8 characters',
      });
    }

    await opts.resetPasswordUseCase.execute(token, newPassword);
    return reply.status(204).send();
  });

  // 8. POST /api/v1/auth/mfa/enable
  fastify.post('/api/v1/auth/mfa/enable', async (request, reply) => {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply.status(401).send({
        type: 'https://errors.platform.example/auth.unauthorized',
        title: 'Unauthorized',
        status: 401,
        code: 'auth.unauthorized',
        detail: 'Valid Bearer token required',
      });
    }

    const result = await opts.enableMfaUseCase.execute(userId);
    return reply.status(200).send(result);
  });

  // 9. POST /api/v1/auth/mfa/verify
  fastify.post<{ Body: { code: string } }>('/api/v1/auth/mfa/verify', async (request, reply) => {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply.status(401).send({
        type: 'https://errors.platform.example/auth.unauthorized',
        title: 'Unauthorized',
        status: 401,
        code: 'auth.unauthorized',
        detail: 'Valid Bearer token required',
      });
    }

    const { code } = request.body || {};
    if (!code) {
      return reply.status(422).send({
        type: 'https://errors.platform.example/validation.invalid_input',
        title: 'Validation Failed',
        status: 422,
        code: 'validation.invalid_input',
        detail: 'code is required',
      });
    }

    const result = await opts.verifyMfaUseCase.execute(userId, code);
    return reply.status(200).send(result);
  });
};
