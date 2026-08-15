export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled' | 'expired';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
export type PaymentStatus = 'created' | 'pending' | 'succeeded' | 'failed' | 'refunded';
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type EntryDirection = 'debit' | 'credit';

export interface Plan {
  id: string;
  key: string;
  displayName: string;
  status: 'draft' | 'active' | 'retired';
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanVersion {
  id: string;
  planId: string;
  version: number;
  status: 'draft' | 'published' | 'retired';
  currency: string;
  priceMinor: number;
  billingPeriod: 'month' | 'year' | 'custom';
  publishedAt: Date | null;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planVersionId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerEntry {
  id: string;
  tenantId: string;
  sourceType: string;
  sourceId: string;
  description: string;
  occurredAt: Date;
  createdAt: Date;
}

export interface LedgerLine {
  id: string;
  tenantId: string;
  entryId: string;
  accountId: string;
  direction: EntryDirection;
  amountMinor: number;
  currency: string;
}
