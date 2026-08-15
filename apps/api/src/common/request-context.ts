import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId: string;
  correlationId: string;
  userId?: string | undefined;
  sessionId?: string | undefined;
  tenantId?: string | undefined;
};

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext {
  const ctx = requestContextStorage.getStore();
  if (!ctx) throw new Error('request_context_missing');
  return ctx;
}
