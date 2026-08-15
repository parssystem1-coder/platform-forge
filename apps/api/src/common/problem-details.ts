import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import type { ProblemDetails } from '@platform/contracts';
import { requestContextStorage } from './request-context.js';

export interface AppErrorLike {
  code?: string;
  status?: number;
  statusCode?: number;
  message: string;
  meta?: Record<string, unknown>;
}

export function formatProblemDetails(
  err: FastifyError | AppErrorLike | Error,
  req: FastifyRequest,
): { status: number; body: ProblemDetails } {
  const ctx = requestContextStorage.getStore();
  const correlationId = ctx?.correlationId ?? (req.headers['x-correlation-id'] as string) ?? 'unknown';

  let status = 500;
  let code = 'server.internal_error';
  let title = 'Internal Server Error';
  let detail = err.message;
  let meta: Record<string, unknown> | undefined;

  const appErr = err as AppErrorLike;

  if (typeof appErr.status === 'number') {
    status = appErr.status;
  } else if (typeof (err as FastifyError).statusCode === 'number') {
    status = (err as FastifyError).statusCode!;
  }

  if (appErr.code) {
    code = appErr.code;
  }

  if (appErr.meta) {
    meta = appErr.meta;
  }

  // Fastify Schema Validation Error
  if ((err as FastifyError).validation) {
    status = 422;
    code = 'validation.invalid_input';
    title = 'Validation Failed';
    detail = err.message;
  } else if (status === 404) {
    code = 'routing.not_found';
    title = 'Resource Not Found';
  } else if (status === 401) {
    title = 'Unauthorized';
  } else if (status === 402) {
    title = 'Feature Upgrade Required';
  } else if (status === 403) {
    title = 'Forbidden';
  } else if (status === 409) {
    title = 'State Conflict';
  } else if (status === 429) {
    title = 'Quota Exceeded';
  }

  const problem: ProblemDetails = {
    type: `https://errors.platform.example/${code}`,
    title,
    status,
    code,
    detail,
    instance: req.url,
    correlationId,
    ...(meta ? { meta } : {}),
  };

  return { status, body: problem };
}

export function problemDetailsErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { status, body } = formatProblemDetails(error, request);
  reply
    .status(status)
    .header('content-type', 'application/problem+json; charset=utf-8')
    .send(body);
}
