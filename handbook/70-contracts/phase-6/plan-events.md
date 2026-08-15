# Event Contract فاز ۶

```text
platform.plan_created
platform.plan_version_created
platform.plan_version_published
platform.plan_version_retired
tenancy.plan_assigned
tenancy.plan_changed
tenancy.feature_override_created
tenancy.feature_override_expired
tenancy.effective_features_changed
```

تمام تغییرهای assignment و override باید Audit و Outbox داشته باشند و cache effective features را invalidate کنند.
