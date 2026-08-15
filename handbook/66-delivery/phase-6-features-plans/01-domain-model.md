# مدل دامنه Features و Plans

## موجودیت‌ها

### Plan

هویت تجاری قابل نمایش، مثل Starter یا Professional.

### PlanVersion

نسخه immutable از Plan با Featureها، Quotaها و Price snapshot. Subscription همیشه به نسخه اشاره می‌کند، نه به Plan mutable.

### FeatureDefinition

تعریف کلید قابلیت، توضیح، نوع و status.

### PlanFeature

رابط PlanVersion و FeatureDefinition با enabled/variant/value.

### PlanQuota

سقف یک quota key برای یک PlanVersion.

### AddOn

افزونه‌ای مستقل از PlanVersion که بعداً در Billing فروخته می‌شود؛ در این فاز schema و resolver contract آماده می‌شود.

### TenantFeatureOverride

استثنای کنترل‌شده برای Enterprise یا پشتیبانی. باید actor، دلیل، زمان انقضا و Audit داشته باشد.

## محاسبه

```text
Effective Feature Set
 = PlanVersion
 + AddOns
 + Tenant Overrides
```

اولویت تعارض:

```text
Tenant Override > AddOn > PlanVersion
```

## قوانین

- PlanVersion منتشرشده immutable است.
- تغییر Plan یعنی ساخت Version جدید.
- Tenant قدیمی ناگهان با تغییر Plan جدید تغییر نمی‌کند.
- Downgrade داده را حذف نمی‌کند.
- Feature read می‌تواند محدود شود، اما حذف داده ممنوع است.
