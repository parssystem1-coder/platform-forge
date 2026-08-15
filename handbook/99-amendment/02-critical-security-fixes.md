# ۹ اصلاح امنیتی P0

> اگر امروز فقط یک فایل از این اصلاحیه را می‌خوانی، همین است.
> مجموعه این نه مورد یک حرف را می‌زنند: ادعای «چهار لایه دفاع مستاجر» در وضع فعلی معتبر نیست، چون لایه آخر روی چند جدول کلیدی غایب است.

## تست طلایی قبل از هر کاری

این دو کوئری را روی دیتابیس فعلی با نقش app اجرا کن. هر دو باید صفر ردیف بدهند. امروز نمی‌دهند:

```sql
-- باید صفر باشد: جدول‌های tenant-bound بدون FORCE RLS
SELECT c.relname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN information_schema.columns col
    ON col.table_schema = n.nspname AND col.table_name = c.relname
 WHERE n.nspname = 'public' AND c.relkind = 'r'
   AND col.column_name = 'tenant_id'
   AND (c.relrowsecurity = false OR c.relforcerowsecurity = false);
-- امروز برمی‌گرداند: outbox_events, outbox_dead_letters, ledger_accounts

-- باید صفر باشد: پالیسی‌های بدون WITH CHECK
SELECT tablename, policyname FROM pg_policies
 WHERE schemaname = 'public' AND with_check IS NULL AND cmd IN ('ALL','INSERT','UPDATE');
-- امروز برمی‌گرداند: تمام پالیسی‌های فاز ۱ تا ۳
```

---

## S-1 و S-2: دو جدول outbox بدون هیچ پالیسی (F-001، F-002)

مهم‌ترین یافته کل ممیزی. `outbox_events.payload` کامل‌ترین جای سیستم از نظر داده حساس است: محتوای سفارش، ایمیل خریدار، رخدادهای هویتی. و این جدول هیچ پالیسی ندارد.

**نکته طراحی که مهم است:** نمی‌توانی به سادگی پالیسی tenant بگذاری، چون worker باید عمداً بین‌مستاجری بخواند. جواب اشتباه این است که جدول را بدون RLS رها کنی. جواب درست: **نقش جداگانه `platform_worker`**.

```text
platform_app    -> فقط رخداد مستاجر جاری، با USING و WITH CHECK
platform_worker -> بین‌مستاجری، صریح، قابل ممیزی، فقط روی ۳ جدول
```

این از «RLS را خاموش کن چون worker لازم دارد» بینهایت بهتر است، چون دسترسی بین‌مستاجری به یک credential مشخص محدود می‌ماند که فقط worker دارد و API ندارد.

اجرا: `30-data/ddl/amendment/0010_rls_hardening.sql` بخش ۱.

## S-3: پالیسی‌ها بدون `WITH CHECK` (F-006)

دقیقاً همان D-004 است که خودت در دفتر بدهی ثبت کرده بودی و باز ماند. با فقدان `WITH CHECK`، این دو دستور موفق می‌شوند:

```sql
-- مهاجرت یک محصول به مستاجر دیگر
UPDATE products SET tenant_id = '<victim-tenant>' WHERE id = '<mine>';
-- درج سفارش در دفتر مستاجر دیگر
INSERT INTO orders (tenant_id, ...) VALUES ('<victim-tenant>', ...);
```

در پلتفرمی که می‌خواهد فروشگاه میزبانی کند، این یعنی یک مشتری می‌تواند محصول را به فروشگاه رقیب منتقل کند. اصلاح: هر پالیسی از نو ساخته شد با هر دو نیمه.

## S-4: audit جعل‌پذیر (F-007، F-032)

`audit_logs` هم پالیسی `tenant_id IS NULL OR ...` داشت (یعنی درج یک رکورد با tenant خالی و دیدن همه) و هم `UPDATE`/`DELETE` به نقش app داده شده بود. یک رد حسابرسی که می‌شود بازنویسی کرد، رد حسابرسی نیست. اصلاح: پالیسی read و insert جدا، با `REVOKE UPDATE, DELETE`. همین برای `ledger_entries`، `ledger_lines`، `outbox_dead_letters` و `payment_webhook_events` اعمال شد.

## S-5 و S-6: دفتر مالی بدون مرز مستاجر (F-004، F-005)

`ledger_lines` نه `tenant_id` دارد نه RLS، و `ledger_accounts` از آرایه RLS جا مانده. یعنی در فاز پول، مبالغ دقیق هر مشتری برای هر مشتری دیگر قابل خواندن است.

**چرا denormalize کردم و نه پالیسی با join:** RLS نمی‌تواند join را دنبال کند، پالیسی مبتنی بر subquery هم کند است و هم از مسیر ردیف پدر قابل دور زدن. پس `tenant_id` روی خط می‌نشیند و یک trigger تضمین می‌کند همیشه با entry پدر یکسان باشد.

## S-7: یگانگی سراسری در دفتر (F-009)

`UNIQUE (source_type, source_id)` بدون `tenant_id`. دو مستاجر با همان `source_id` یکی را مسدود می‌کنند. این دقیقاً از آن باگ‌هایی است که در محیط توسعه هرگز دیده نمی‌شود و در تولید، فاکتور یک مشتری را بی‌صدا می‌خورد.

## S-8: تبدیل رشته خالی به uuid (F-008)

این را در هیچ ریویی نمی‌بینند تا روزی که در تولید بزند. `current_setting('app.tenant_id', true)` اگر تنظیم نشده باشد `NULL` می‌دهد (مطلوب)، اما اگر رشته خالی باشد `''::uuid` می‌ترکد. الان همه پالیسی‌ها از تابع واحد `app_current_tenant()` استفاده می‌کنند که `nullif` دارد. مزیت جانبی: اگر فردا بخواهی منطق tenant context را عوض کنی، یک جا عوض می‌کنی نه ۴۰ پالیسی.

## S-9: مرغ و تخم‌مرغ جدول tenants (F-033)

پالیسی `id = app.tenant_id` به این معناست که:

- ثبت‌نام غیرممکن است: وقتی tenant وجود ندارد، context هم وجود ندارد، پس `INSERT` رد می‌شود.
- «Tenant Switcher» که در فاز ۱ به‌عنوان خروجی قابل نمایش وعده داده شده، قابل پیاده‌سازی نیست، چون کاربر برای دیدن لیست، باید از قبل درون یکی باشد.

اصلاح سه پالیسیه: context فعال، خواندن از مسیر membership با `app.user_id`، و یک مسیر باریک provisioning. جزئیات در ADR-0015.
