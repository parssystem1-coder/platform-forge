# ۱۶. کنترل دسترسی

## ۱۶.۱ پنج سؤال، یک تابع

نسخه اولیه هفت لایه چک داشت. مشکل هفت لایه این است که روزی دو تایشان مخالف هم جواب می‌دهند و هیچ‌کس نمی‌داند کدام مرجع است.

پنج سؤال واقعی:

| # | سؤال | مفهوم |
| --- | ------ | -------- |
| ۱ | تو کی هستی؟ | Authentication |
| ۲ | در این Tenant عضو هستی؟ | Membership |
| ۳ | این عمل را مجازی؟ | Permission |
| ۴ | این Tenant این قابلیت را دارد؟ | Feature |
| ۵ | سقف مصرف را رد نکرده؟ | Quota |

هر پنج در یک تابع جمع می‌شوند:

```ts
await authorize(actor, 'commerce.product.create', { tenantId }, { quantity: 1 });
```

اگر در کل کد بیش از یک جای تصمیم‌گیری داشتی، روزی یکی از آن‌ها را فراموش می‌کنی.

---

## ۱۶.۲ Permission در مقابل Feature

این تفکیک در نسخه اولیه درست بود و حفط می‌شود:

```text
Permission: این کاربر مجاز است؟          -> مربوط به نقش
Feature:    این Tenant خریده و روشن است؟ -> مربوط به پلن
```

ماتریس نتیجه:

| Permission | Feature | نتیجه | کد خطا |
| ----------- | --------- | ------- | --------- |
| دارد | دارد | مجاز | — |
| ندارد | دارد | رد | `authz.forbidden` (403) |
| دارد | ندارد | رد | `billing.feature_not_available` (402) |
| دارد | دارد ولی سقف پر | رد | `billing.quota_exceeded` (429) |

> تفاوت کد خطا مهم است. کاربری که قابلیت را نخریده باید کارت ارتقا ببیند، نه پیام «دسترسی ممنوع».
> این فقط تجربه کاربری نیست، مستقیماً درآمد است.

---

## ۱۶.۳ فضای نام Permission

الگو: `<module>.<resource>.<action>`

```text
identity.user.read
identity.session.revoke

tenancy.member.invite
tenancy.member.remove
tenancy.tenant.update

commerce.product.read
commerce.product.create
commerce.product.update
commerce.product.delete
commerce.order.read
commerce.order.refund
commerce.inventory.adjust

billing.subscription.read
billing.subscription.change
billing.invoice.read

platform.plan.manage        <- فقط Platform Staff
platform.tenant.suspend     <- فقط Platform Staff
```

### قواعد

- Permission ها در کد رجیستر می‌شوند، نه در دیتابیس. دلیل: قابل refactor و قابل جستجو هستند.
- Role به Permission در کد شروع می‌شود، در فاز بعدی نقش سفارشی در دیتابیس اضافه می‌شود.
- هیچ Permission بدون مصرف‌کننده واقعی اضافه نمی‌شود.

رجیستری کامل در `70-contracts/permissions.md`.

---

## ۱۶.۴ نقش‌های پیش‌فرض

| نقش | توضیح |
| ----- | -------- |
| `owner` | همه چیز در Tenant، شامل صورتحساب و حذف Tenant |
| `admin` | همه چیز جز صورتحساب و حذف Tenant |
| `member` | عملیات روزمره، بدون تغییر تنطیمات حساس |
| `viewer` | فقط خواندن |

قاعده طلایی: **هر Tenant حداقل یک owner فعال دارد.** حذف یا تنزل آخرین owner ممنوع است.
این دقیقاً همان باگی است که همه یک بار در پروداکشن تجربه می‌کنند.

---

## ۱۶.۵ پیاده‌سازی تابع واحد

```ts
export interface ActorContext {
  kind: 'user' | 'customer' | 'staff' | 'machine';
  userId?: string;
  customerId?: string;
  staffId?: string;
  clientId?: string;
  tenantId?: string;
  sessionId?: string;
  scopes?: string[];
  impersonatedBy?: string;
}

export interface AuthorizeOptions {
  quantity?: number;      // برای چک Quota
  skipQuota?: boolean;    // فقط برای عملیات خواندنی
}

export class AuthorizationService {
  async authorize(
    actor: ActorContext,
    permission: PermissionKey,
    resource: { tenantId: string },
    opts: AuthorizeOptions = {},
  ): Promise<void> {
    if (!actor.tenantId || actor.tenantId !== resource.tenantId) {
      throw new InvalidTenantContext();
    }

    if (actor.kind === 'machine') {
      this.assertScope(actor, permission);
    }

    const membership = await this.memberships.findActive(actor.userId!, resource.tenantId);
    if (!membership) throw new MembershipNotFound();

    const allowed = this.roles.permissionsOf(membership.role).has(permission);
    if (!allowed) throw new Forbidden(permission);

    const feature = FEATURE_BY_PERMISSION[permission];
    if (feature) {
      const enabled = await this.features.isEnabled(resource.tenantId, feature);
      if (!enabled) throw new FeatureNotAvailable(feature);
    }

    const quotaKey = QUOTA_BY_PERMISSION[permission];
    if (quotaKey && !opts.skipQuota) {
      await this.quota.assertAvailable(resource.tenantId, quotaKey, opts.quantity ?? 1);
    }
  }
}
```

### نکته معماری مهم

در فاز ۱، `features.isEnabled` از یک فایل config خوانده می‌شود و `quota` یک no-op است.
در فاز ۴ و ۶، فقط پیاده‌سازی درون همین دو متد عوض می‌شود.
**هیچ فراخوانی‌ای تغییر نمی‌کند.** این همان تعریف واقعی future-ready است.

---

## ۱۶.۶ چرا چک داخل Use Case است و نه Guard

Guard فقط می‌داند کاربر کیست. نمی‌داند منبع مورد هدف متعلق به کدام Tenant است.

مثال حمله:

```text
PATCH /api/v1/products/PRODUCT_OF_TENANT_B
X-Tenant-Id: TENANT_A
```

Guard می‌گوید مجاز است چون کاربر در Tenant A ادمین است.
Use Case باید محصول را در محدوده‌ی Tenant فعلی بخواند و اگر نبود، 404 بدهد.

و در لایه آخر، RLS حتی اگر کد را هم خراب بنویسی، رکورد را نمی‌دهد.

---

## ۱۶.۷ دسترسی ماشینی

API key و OAuth client هویت انسانی نیستند. دو تفاوت عملیاتی:

1. `scope` محدودکننده مازاد بر Permission
2. Audit باید بتواند تفکیک کند این عمل توسط کدام برنامه انجام شد

در نتیجه هر رکورد Audit هم `actor_user_id` دارد و هم `actor_client_id`.

---

## ۱۶.۸ معیار پذیرش

- جستجوی کل کد برای الگوی مقایسه مستقیم نقش باید صفر نتیجه خارج از ماژول access-control بدهد
- تست واحد کامل روی ماتریس نقش در Permission
- تست: فقدان Feature کد 402 می‌دهد نه 403
- تست: عبور از سقف کد 429 می‌دهد
- تست: دسترسی به منبع Tenant دیگر کد 404 می‌دهد نه 403 (عدم افشای وجود منبع)
- تست: حذف آخرین owner رد می‌شود
