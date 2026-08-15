export type TenantStatus = 'active' | 'suspended' | 'archived';
export type MembershipRole = 'owner' | 'admin' | 'member' | 'viewer';
export type MembershipStatus = 'active' | 'invited' | 'suspended';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  customDomain: string | null;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  id: string;
  tenantId: string;
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  invitedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
