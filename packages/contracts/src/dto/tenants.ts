export interface SwitchTenantRequest {
  tenantId: string;
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  memberships: Array<{
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    role: string;
  }>;
}

export interface TenantMembershipDto {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  role: string;
  status: string;
}
