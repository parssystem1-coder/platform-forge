# طراحی Tenancy فاز ۱

## قواعد

1. User متعلق به هیچ Tenant نیست.
2. Tenant مالک داده کسب‌وکار است.
3. Membership تنها رابطه رسمی User و Tenant است.
4. هر Tenant حداقل یک Owner فعال دارد.
5. Role در Membership قرار دارد، نه در User.
6. Tenant context از request می‌آید، ولی بدون Membership معتبر نمی‌شود.

## Tenant Context

```ts
interface TenantContext {
  tenantId: string;
  userId: string;
  membershipId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  correlationId: string;
}
```

## Header policy

در API مدیریتی `X-Tenant-Id` مجاز است، اما فقط به‌عنوان candidate context. سرور باید membership و status را دوباره چک کند.

در Storefront آینده، Tenant از Host/Domain mapping می‌آید و header کلاینت نادیده گرفته می‌شود.
