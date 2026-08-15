# معماری Features و Plans

## مسیر تصمیم

```text
Request
 -> authenticate
 -> tenant context
 -> membership
 -> permission
 -> effective feature resolver
 -> quota checker
 -> use case
```

## Resolver contract

```ts
interface FeatureResolver {
  isEnabled(tenantId: string, featureKey: string): Promise<boolean>;
  getValue<T>(tenantId: string, featureKey: string): Promise<T | null>;
  explain(tenantId: string): Promise<EffectiveFeatureSet>;
}
```

## Cache

```text
key: tenant:{tenantId}:effective-features:{version}
```

Invalidate on:

- Plan assignment
- PlanVersion publication affecting new assignments
- AddOn change
- Override create/update/expire

## امنیت

Platform Admin و Tenant Admin دو realm جدا هستند. Tenant Admin فقط subscription/featureهای خودش را می‌بیند؛ Plan catalog و PlanVersion را Platform Admin مدیریت می‌کند.

## Downgrade

```text
assignment changes
 -> effective set recalculated
 -> data untouched
 -> create paths enforce new quota
 -> read/export paths remain safe
 -> audit + outbox
```
