# رجیستری دسترسی

این فایل مرجع است. هر Permission جدید اول اینجا ثبت می‌شود.

## الگو

```text
<module>.<resource>.<action>
```

## ماتریس نقش و دسترسی فاز ۱ و ۲

| Permission | owner | admin | member | viewer | Feature | Quota |
| ----------- | :-----: | :-----: | :------: | :------: | --------- | ------- |
| `identity.user.read` | X | X | X | X | — | — |
| `identity.session.revoke` | X | X | X | X | — | — |
| `tenancy.tenant.read` | X | X | X | X | — | — |
| `tenancy.tenant.update` | X | X | | | — | — |
| `tenancy.member.read` | X | X | X | X | — | — |
| `tenancy.member.invite` | X | X | | | — | `tenancy.members` |
| `tenancy.member.remove` | X | X | | | — | — |
| `tenancy.member.change_role` | X | | | | — | — |
| `commerce.product.read` | X | X | X | X | `commerce.catalog` | — |
| `commerce.product.create` | X | X | X | | `commerce.catalog` | `commerce.products` |
| `commerce.product.update` | X | X | X | | `commerce.catalog` | — |
| `commerce.product.delete` | X | X | | | `commerce.catalog` | — |
| `commerce.order.read` | X | X | X | X | `commerce.orders` | — |
| `commerce.order.update` | X | X | X | | `commerce.orders` | — |
| `commerce.order.refund` | X | X | | | `commerce.orders` | — |
| `commerce.inventory.adjust` | X | X | X | | `commerce.inventory` | — |
| `commerce.customer.read` | X | X | X | X | `commerce.customers` | — |
| `billing.subscription.read` | X | | | | — | — |
| `billing.subscription.change` | X | | | | — | — |
| `billing.invoice.read` | X | | | | — | — |
| `api.key.manage` | X | | | | `platform.api` | — |

## دسترسی‌های Platform Staff

این‌ها در realm جدا هستند و هرگز به نقش Tenant داده نمی‌شوند:

```text
platform.plan.manage
platform.tenant.read
platform.tenant.suspend
platform.tenant.impersonate
platform.audit.read
platform.billing.manage
```

## قواعد افزودن

1. بدون مصرف‌کننده‌ی واقعی اضافه نمی‌شود
2. هر ردیف باید Feature و Quota متناطر را مشخص کند (یا صریحاً خط تیره)
3. تست ماتریس باید به‌روز شود
