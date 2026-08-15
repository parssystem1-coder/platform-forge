export type ActorKind = 'user' | 'customer' | 'staff' | 'machine';

export interface ActorContext {
  kind: ActorKind;
  userId?: string | undefined;
  customerId?: string | undefined;
  staffId?: string | undefined;
  clientId?: string | undefined;
  tenantId?: string | undefined;
  sessionId?: string | undefined;
  scopes?: string[] | undefined;
  staffPermissions?: string[] | undefined;
  impersonatedBy?: string | undefined;
  correlationId: string;
}

export type PermissionKey = string;

export interface AuthorizeOptions {
  quantity?: number | undefined;
}

export interface AuthorizationResult {
  actorKind: ActorKind;
  tenantId: string;
  quotaKey?: string | undefined;
  quantity: number;
}
