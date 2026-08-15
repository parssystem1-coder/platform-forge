# طراحی Authorization فاز ۱

## تنها نقطه تصمیم

```ts
authorize(actor, permission, resource, options)
```

## ترتیب چک

```text
Authenticated actor
 -> active session
 -> tenant context
 -> active membership
 -> role permissions
 -> feature resolver (Phase 1 config adapter)
 -> quota checker (Phase 1 no-op adapter)
```

## Permissionهای فاز ۱

```text
identity.user.read
identity.session.read
identity.session.revoke
tenancy.tenant.read
tenancy.tenant.update
tenancy.member.read
tenancy.member.invite
tenancy.member.remove
tenancy.member.change_role
```

## پاسخ‌های خطا

- 400: tenant context نامعتبر
- 401: احراز هویت ناموفق
- 403: membership یا permission وجود ندارد
- 402: Feature در پلن فعال نیست (در فازهای بعد)
- 429: quota تمام شده (در فازهای بعد)

## نکته امنیتی

برای منبعی که متعلق به Tenant دیگر است، تا حد امکان 404 برگردان تا وجود آن منبع افشا نشود.
