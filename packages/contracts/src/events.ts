export interface DomainEventEnvelope<T = Record<string, unknown>> {
  id: string;
  eventType: string;
  eventVersion: number;
  aggregateType: string;
  aggregateId: string;
  tenantId: string | null;
  occurredAt: Date;
  correlationId: string;
  causationId?: string | null;
  payload: T;
}
