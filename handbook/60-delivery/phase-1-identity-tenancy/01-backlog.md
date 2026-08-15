# Phase 1 Backlog

## Sprint 1: Identity Foundation

| ID | Story | Tasks | Points | Priority |
|---|---|---|---|---|
| I-01 | As a new user, I can register with email and password | User Entity, Repository, Register UC | 5 | P0 |
| I-02 | As a user, I can log in with credentials | Login UC, Password Hasher | 5 | P0 |
| I-03 | As a user, I can log out | Logout UC, Session cleanup | 3 | P0 |
| I-04 | As a user, I receive JWT tokens | Token Service, JWT generation | 5 | P0 |
| I-05 | As a user, I can refresh expired tokens | Refresh Token UC, Rotation | 5 | P0 |

## Sprint 2: Email Verification + Password Reset

| ID | Story | Tasks | Points | Priority |
|---|---|---|---|---|
| I-06 | As a user, I verify my email | Verify Email UC, Token generation | 5 | P0 |
| I-07 | As a user, I can reset my password | Password Reset UC, Token generation | 5 | P0 |

## Sprint 3: MFA

| ID | Story | Tasks | Points | Priority |
|---|---|---|---|---|
| I-08 | As a user, I can enable MFA | Enable MFA UC, TOTP setup | 8 | P1 |
| I-09 | As a user, I can verify with MFA code | Verify MFA UC | 3 | P1 |

## Sprint 4: Tenancy

| ID | Story | Tasks | Points | Priority |
|---|---|---|---|---|
| T-01 | As a user, I can create a tenant | Create Tenant UC, Membership | 5 | P0 |
| T-02 | As a user, I can see my tenants | List Tenants UC | 3 | P0 |
| T-03 | As a user, I can switch between tenants | Switch Tenant UC | 5 | P0 |
| T-04 | As a tenant owner, I can invite members | Invite Member UC | 5 | P1 |
| T-05 | As a tenant owner, I can remove members | Remove Member UC | 3 | P1 |
| T-06 | As a tenant owner, I can change member roles | Update Role UC | 3 | P1 |

## Sprint 5: Authorization

| ID | Story | Tasks | Points | Priority |
|---|---|---|---|---|
| A-01 | As a system, I enforce permissions | Permission System, Role Registry | 8 | P0 |
| A-02 | As a customer, I can access my own orders | authorizeCustomer() | 5 | P0 |
| A-03 | As staff, my actions are audited | Staff Authorization, Audit | 5 | P0 |

## Sprint 6: REST API

| ID | Story | Tasks | Points | Priority |
|---|---|---|---|---|
| R-01 | All identity endpoints work | Auth Controller, Validation | 8 | P0 |
| R-02 | All tenancy endpoints work | Tenants Controller | 5 | P0 |
| R-03 | OpenAPI spec is up to date | Spec update, Examples | 3 | P1 |

## Sprint 7: Testing & Integration

| ID | Story | Tasks | Points | Priority |
|---|---|---|---|---|
| IT-01 | All integration tests pass | Integration tests | 8 | P0 |
| IT-02 | Tenant leak test passes | Tenant Leak Test | 5 | P0 |
| IT-03 | E2E tests pass | E2E tests | 8 | P1 |

## Total Points: 113

| Priority | Points |
|---|---|
| P0 (Must have) | 68 |
| P1 (Should have) | 45 |

## Definition of Ready

A story is ready when:

- [ ] Acceptance criteria written
- [ ] Dependencies identified
- [ ] Point estimate agreed
- [ ] API contract defined (if applicable)

## Definition of Done

A story is done when:

- [ ] Code implemented
- [ ] Unit tests written
- [ ] Code reviewed
- [ ] Merged to main
- [ ] CI green
