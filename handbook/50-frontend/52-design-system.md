# ۵۲. دیزاین سیستم

## ۵۲.۱ اصل

یک دیزاین سیستم، دو قالب تم: پنل و فروشگاه.
فروشگاه باید قابل برندشدن توسط مشتری باشد، پنل نه.

---

## ۵۲.۲ توکن‌ها

```text
color:      primary, neutral, success, warning, danger, info
            هر کدام با پله 50 تا 950
spacing:    مقیاس 4px (1,2,3,4,6,8,12,16,20,24)
radius:     sm, md, lg, xl, full
shadow:     sm, md, lg
typography: مقیاس xs تا 4xl با line-height متناسب
z-index:    dropdown 1000, sticky 1100, modal 1300, toast 1400
```

### رنگ برند مشتری

مشتری فقط متغیرهای مجاز را عوض می‌کند:

```css
:root {
  --brand-primary: #2563eb;
  --brand-radius: 8px;
  --brand-font: 'Vazirmatn', sans-serif;
}
```

هرگز اجازه‌ی CSS دلخواه نده. این راه مطمئن شکستن قالب و تکت پشتیبانی است.

---

## ۵۲.۳ مولفه‌های حداقلی فاز ۱ و ۲

```text
Button, IconButton
Input, Textarea, Select, Combobox, Checkbox, Radio, Switch
Form (با نمایش خطا), FieldError
Table (مرتب‌سازی، صفحه‌بندی، حالت خالی، اسکلت)
Modal, Drawer, Popover, Tooltip
Toast, Alert, Banner
Tabs, Breadcrumb, Pagination
Badge, Avatar, Skeleton, Spinner
EmptyState, ErrorState
UpgradeCard        <- مخصوص خطای 402
QuotaMeter         <- نمایش مصرف
```

دو مولفه آخر را اکثر تیم‌ها فراموش می‌کنند و بعداً مجبور می‌شوند در ۲۰ جا دستی بسازند.

---

## ۵۲.۴ دسترس‌پذیری

سطح هدف: WCAG 2.1 AA

الزامات قطعی:

- هر ورودی label دارد
- نسبت کنتراست حداقل 4.5:1
- مسیر کامل با کیبورد
- حلقه focus قابل مشاهده
- دام focus در مودال
- پیام خطا با `aria-live`
- هر تصویر محصول alt دارد

---

## ۵۲.۵ راست‌به‌چپ

این پروژه فارسی است، پس RTL از روز اول است نه ویژگی بعدی:

- از خواص منطقی CSS استفاده کن: `margin-inline-start` نه `margin-left`
- اعداد و تاریخ با `Intl` قالب‌بندی شوند
- تقویم شمسی در UI، ذخیره UTC در دیتابیس
- آیکون‌های جهت‌دار در RTL باید قرینه شوند

> قاعده‌ی مهم: ذخیره همیشه UTC و میلادی. نمایش شمسی. هرگز تاریخ شمسی در دیتابیس ذخیره نکن.
