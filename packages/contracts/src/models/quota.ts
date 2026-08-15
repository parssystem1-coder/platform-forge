export type QuotaKind = 'gauge' | 'counter';
export type FeatureValueType = 'boolean' | 'integer' | 'number' | 'string' | 'json';

export interface FeatureDefinition {
  key: string;
  description: string;
  valueType: FeatureValueType;
  status: 'active' | 'retired';
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotaDefinition {
  key: string;
  description: string;
  unit: string;
  kind: QuotaKind;
  status: 'active' | 'retired';
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotaCounter {
  tenantId: string;
  quotaKey: string;
  periodStart: Date;
  periodEnd: Date;
  limitValue: number;
  usedValue: number;
  reservedValue: number;
  updatedAt: Date;
}

export interface QuotaReservation {
  id: string;
  tenantId: string;
  quotaKey: string;
  periodStart: Date;
  quantity: number;
  status: 'pending' | 'committed' | 'released' | 'expired';
  idempotencyKey: string;
  expiresAt: Date;
  createdAt: Date;
}
