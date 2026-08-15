import type { FastifyPluginAsync } from 'fastify';
import type { RegisterUserUseCase } from '../application/register-user.use-case.js';
import type { LoginUserUseCase } from '../application/login-user.use-case.js';
import type { VerifyEmailUseCase } from '../application/verify-email.use-case.js';
import type { RefreshTokenUseCase } from '../application/refresh-token.use-case.js';
import type { RegisterRequest, LoginRequest } from '@platform/contracts';

export interface AuthControllerOptions {
  registerUseCase: RegisterUserUseCase;
  loginUseCase: LoginUserUseCase;
  verifyEmailUseCase: VerifyEmailUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
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
};
