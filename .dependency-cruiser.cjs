/**
 * Architecture boundaries, enforced by a tool and not by good intentions.
 * AMENDMENT v3 adds the three rules the original config was missing:
 *   no-cross-app-imports      (F-017)
 *   no-second-tenant-path     (F-016)
 *   no-raw-escape-hatch       (F-027)
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-is-pure',
      comment: 'domain must not know about NestJS, ORM, HTTP, Redis, env or logger',
      severity: 'error',
      from: { path: '^apps/api/src/modules/[^/]+/domain' },
      to: { path: 'node_modules/(@nestjs|drizzle-orm|pg|ioredis|axios|express)' },
    },
    {
      name: 'no-interface-to-infrastructure',
      comment: 'interfaces -> application -> domain. Never interfaces -> infrastructure',
      severity: 'error',
      from: { path: '^apps/api/src/modules/[^/]+/interfaces' },
      to: { path: '^apps/api/src/modules/[^/]+/infrastructure' },
    },
    {
      name: 'no-module-internals',
      comment: 'a module may only use another module public contract',
      severity: 'error',
      from: { path: '^apps/api/src/modules/([^/]+)/' },
      to: {
        path: '^apps/api/src/modules/(?!$1)([^/]+)/(?!index\\.ts|contract)',
        pathNot: '^apps/api/src/modules/([^/]+)/index\\.ts$',
      },
    },
    {
      name: 'no-cross-app-imports',
      comment: 'F-017: worker must not reach into apps/api. Share via packages/*',
      severity: 'error',
      from: { path: '^apps/(worker|web)/' },
      to: { path: '^apps/api/' },
    },
    {
      name: 'no-second-tenant-path',
      comment: 'F-016: kernel/unit-of-work is the only tenant context implementation',
      severity: 'error',
      from: { pathNot: '^apps/api/src/kernel/unit-of-work\\.ts$' },
      to: { path: '^apps/api/src/db/tenant-db\\.ts$' },
    },
    {
      name: 'no-raw-escape-hatch',
      comment:
        'F-027: withPlatform and withProvisioning may only be called from the kernel ' +
        'and from identity/tenancy use cases. Everything else uses withTenant.',
      severity: 'error',
      from: {
        pathNot:
          '^(apps/api/src/kernel/|apps/api/src/modules/(identity|tenancy)/application/)',
      },
      to: { path: '^apps/api/src/kernel/provisioning' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      from: { orphan: true, pathNot: '\\.d\\.ts$' },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
  },
};
