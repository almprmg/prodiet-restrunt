# مواصفات واجهات الـ API (Prodiet Backend)

## نظرة عامة
- قاعدة المسار: `BASE_URL = /api`
- مسار لوحة الإدارة: `BASE_URL/admin`
- جميع نقاط النهاية تحت `/admin` محمية بالتوكن وتتطلب الهيدر: `Authorization: Bearer <token>`
- يتم التحقق من صلاحيات الشاشة عبر `screen_key` وقيم الإجراءات (`add|edit|delete|view|print`)
- الرفع للصور يتم عبر `multipart/form-data` بحقول: `photo` أو `file` حسب المورد
- الترقيم: جميع قوائم `list` تدعم `page` و`limit`

---

## الصحة
- الطريقة: `GET`
- المسار: `/api/health`
- مثال الاستجابة:
```json
{ "status": "ok", "message": "Server is running" }
```

---

## المصادقة
### تسجيل دخول الأدمن
- الطريقة: `POST`
- المسار: `/api/admin/login`
- الجسم (JSON):
```json
{ "username": "admin", "password": "admin@123" }
```
- مثال استجابة:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": 1,
      "full_name": "Admin",
      "username": "admin",
      "role_id": 1,
      "permissions": []
    },
    "branch": { "id": 1, "name": "الفرع الرئيسي" }
  }
}
```
- قيود تسجيل الدخول:
  - لا يُسمح بالدخول إذا كانت حالة المستخدم `inactive`.
  - لا يُسمح بالدخول إذا كانت حالة الفرع للمستخدم `inactive` أو القيمة `is_active = false`.

---

## الفروع (Branches)
### إضافة فرع
- الطريقة: `POST`
- المسار: `/api/admin/branches`
- الهيدر: `Authorization: Bearer <token>`
- الجسم (JSON):
```json
{ "name": "فرع جدة", "address": "جدة - السلام", "phone": "0555555555", "status": "active" }
```

### تعديل فرع
- الطريقة: `PUT`
- المسار: `/api/admin/branches/:id`
- الجسم (JSON):
```json
{ "name": "فرع جدة المعدل", "address": "حي النعيم", "phone": "0511111111", "status": "inactive" }
```

### قائمة الفروع
- الطريقة: `GET`
- المسار: `/api/admin/branches?q=&status=active|inactive|all&page=1&limit=10`

### فرع محدد
- الطريقة: `GET`
- المسار: `/api/admin/branches/:id`

### تفعيل فرع
- الطريقة: `PATCH`
- المسار: `/api/admin/branches/:id/activate`

### إلغاء تفعيل فرع
- الطريقة: `PATCH`
- المسار: `/api/admin/branches/:id/deactivate`

---

## الأدوار والصلاحيات (Roles & Permissions)
### إضافة دور مع صلاحيات
- الطريقة: `POST`
- المسار: `/api/admin/roles`
- الجسم (JSON):
```json
{
  "name": "Manager",
  "description": "Role description",
  "status": "active",
  "permissions": [
    { "screen_key": "Users", "can_add": true, "can_edit": true, "can_delete": false, "can_view": true, "can_print": false },
    { "screen_key": "Plans", "can_add": true, "can_edit": true, "can_delete": true, "can_view": true, "can_print": false }
  ]
}
```

### تعديل دور وصلاحياته
- الطريقة: `PUT`
- المسار: `/api/admin/roles/:id`
- الجسم (JSON): نفس شكل الإضافة

### قائمة الأدوار
- الطريقة: `GET`
- المسار: `/api/admin/roles?q=&status=active|inactive|all&page=1&limit=10`

### دور محدد
- الطريقة: `GET`
- المسار: `/api/admin/roles/:id`

### تفعيل دور
- الطريقة: `PATCH`
- المسار: `/api/admin/roles/:id/activate`

### إلغاء تفعيل دور
- الطريقة: `PATCH`
- المسار: `/api/admin/roles/:id/deactivate`

---

## المستخدمون (Users)
### إضافة مستخدم
- الطريقة: `POST`
- المسار: `/api/admin/users`
- الهيدر: `Content-Type: multipart/form-data`
- الحقول:
  - ملفات: `photo` أو `file` (صورة المستخدم)
  - جسم (حقول نصية):
```json
{
  "full_name": "محمد أحمد",
  "phone": "0550000000",
  "username": "m.ahmed",
  "password": "Strong@123",
  "role_id": 2,
  "branch_id": 1,
  "status": "active"
}
```

### تعديل مستخدم
- الطريقة: `PUT`
- المسار: `/api/admin/users/:id`
- يدعم رفع صورة جديدة بنفس حقول الإضافة، وجميع الحقول اختيارية.

### قائمة المستخدمين
- الطريقة: `GET`
- المسار: `/api/admin/users?q=&status=active|inactive|all&branch_id=&page=1&limit=10`

### مستخدم محدد
- الطريقة: `GET`
- المسار: `/api/admin/users/:id`

### تفعيل مستخدم
- الطريقة: `PATCH`
- المسار: `/api/admin/users/:id/activate`

### إلغاء تفعيل مستخدم
- الطريقة: `PATCH`
- المسار: `/api/admin/users/:id/deactivate`

---

## الوجبات (Meals)
### إضافة وجبة
- الطريقة: `POST`
- المسار: `/api/admin/meals`
- الهيدر: `Content-Type: multipart/form-data`
- الحقول:
  - ملفات: `photo` أو `file` (صورة الوجبة)
  - جسم (حقول نصية):
```json
{
  "name": "صدر دجاج",
  "calories": 200,
  "protein": 30,
  "carbs": 0,
  "fats": 5,
  "description": "وجبة بروتينية"
}
```
- ملاحظة: الصورة إلزامية (سواء مرفوعة أو مسار `image` موجود).

### تعديل وجبة
- الطريقة: `PUT`
- المسار: `/api/admin/meals/:id`
- يدعم رفع صورة جديدة واختيارية.

### حذف وجبة (Soft Delete)
- الطريقة: `DELETE`
- المسار: `/api/admin/meals/:id`

### قائمة الوجبات
- الطريقة: `GET`
- المسار: `/api/admin/meals?q=&page=1&limit=10`

### وجبة محددة
- الطريقة: `GET`
- المسار: `/api/admin/meals/:id`

---

## أيام العمل (Workdays)
### قائمة الأيام
- الطريقة: `GET`
- المسار: `/api/admin/workdays`

### تعديل حالة يوم
- الطريقة: `PUT`
- المسار: `/api/admin/workdays/:id`
- الجسم (JSON):
```json
{ "status": "active" }
```

### تفعيل يوم
- الطريقة: `PATCH`
- المسار: `/api/admin/workdays/:id/activate`

### إلغاء تفعيل يوم
- الطريقة: `PATCH`
- المسار: `/api/admin/workdays/:id/deactivate`

---

## الوحدات (Units)
### قائمة الوحدات النشطة
- الطريقة: `GET`
- المسار: `/api/admin/units`

---

## الباقات (Plans)
### إضافة باقة مع وجباتها
- الطريقة: `POST`
- المسار: `/api/admin/plans`
- الهيدر: `Content-Type: multipart/form-data`
- الحقول:
  - ملفات: `photo` أو `file` (صورة الباقة) — الصورة إلزامية
  - جسم (حقول نصية):
```json
{
  "name": "باقة أسبوعية",
  "price": 199.99,
  "duration_days": 7,
  "description": "باقة عادية لأسبوع",
  "type": "normal",
  "status": "active",
  "meals": [
    { "workday_id": 3, "meal_id": 5, "unit_id": 1, "quantity": 200, "description": "جرام" },
    { "workday_id": 4, "meal_id": 6, "unit_id": 1, "quantity": 150 }
  ]
}
```
- ملاحظات:
  - إذا `type = normal` يجب إرسال `workday_id` لكل صف.
  - إذا `type = custom` لا ترسل `workday_id`.
  - `unit_id` اختياري وافتراضي 1، ويجب أن تكون الوحدة نشطة.
  - يتم التحقق من الوجبات (غير محذوفة)، والوحدات (نشطة)، وأيام العمل (نشطة).

### حذف باقة (Soft Delete)
- الطريقة: `DELETE`
- المسار: `/api/admin/plans/:id`
- يغيّر الحالة إلى `deleted` ويُمنع بعدها أي تفعيل/تعطيل أو معاينة لها.

### تفعيل باقة
- الطريقة: `PATCH`
- المسار: `/api/admin/plans/:id/activate`
- يعمل فقط إذا كانت الباقة ليست `deleted`.

### إلغاء تفعيل باقة
- الطريقة: `PATCH`
- المسار: `/api/admin/plans/:id/deactivate`
- يعمل فقط إذا كانت الباقة ليست `deleted`.

### قائمة الباقات مع البحث والفلترة
- الطريقة: `GET`
- المسار: `/api/admin/plans?q=&status=active|inactive|all&price_min=&price_max=&page=1&limit=10`
- يعيد فقط الباقات غير المحذوفة (`active` أو `inactive`) مع تفاصيل الوجبات.

### معاينة باقة
- الطريقة: `GET`
- المسار: `/api/admin/plans/:id`
- يعيد الباقة إذا كانت حالتها `active` أو `inactive` مع جميع التفاصيل (الوجبات، الوحدة، اليوم، بيانات الوجبة).

---

## الهيدرز العامة
- Authorization: `Bearer <JWT_TOKEN>` (لكل مسارات `/admin` عدا تسجيل الدخول)
- Content-Type:
  - `application/json` للطلبات النصية
  - `multipart/form-data` للطلبات التي تشمل رفع صور (`users`, `meals`, `plans`)

---

## المشتركين (Subscribers)
- ملاحظة الأفرع: إذا كان دور طالب الطلب `SuperAdmin` أو رقم الدور `1`، تُطبّق العمليات على جميع الفروع. غير ذلك تُطبّق فقط على فرع المستخدم.
- صلاحيات الشاشة: `Subscribers` بحسب العملية (`add|edit|view|delete` إن وجدت).

### إضافة مشترك مع اشتراكه
- الطريقة: `POST`
- المسار: `/api/admin/subscribers`
- الهيدر: `Authorization` و`Content-Type: multipart/form-data`
- الحقول:
  - ملفات: `photo` أو `file` (صورة المشترك) — اختياري
  - جسم (حقول نصية):
    - إجباري:
      - `full_name` اسم المشترك
      - `phone` صيغة الهاتف `05XXXXXXXX`
      - `branch_id` رقم الفرع
      - `subscription.plan_id` رقم الباقة
    - اختياري:
      - `subscription.amount_paid` المبلغ المدفوع (افتراضي `0`)
      - `subscription.type` نوع الاشتراك: `pickup | delivery | custom` (افتراضي `pickup`)
      - `subscription.branch_id` فرع الاشتراك (افتراضي فرع المشترك)
      - `subscription.delivery_branch_id` رقم فرع التسليم — إلزامي إذا كان `subscription.type = delivery`، وإلا يكون `null`
      - `subscription.customizations` تخصيصات الباقة (اختياري، مصفوفة عناصر)
- شكل تخصيص عنصر:
```json
{ "prev_meal_id": 5, "new_meal_id": 12, "quantity": 200, "unit_id": 1 }
```
- مثال الطلب:
```json
{
  "full_name": "أحمد علي",
  "phone": "0551234567",
  "branch_id": 1,
  "subscription": {
    "plan_id": 3,
    "amount_paid": 199.99,
    "type": "delivery",
    "delivery_branch_id": 2,
    "customizations": [
      { "prev_meal_id": 5, "new_meal_id": 12, "quantity": 200, "unit_id": 1 }
    ]
  }
}
```
- المخرجات: `subscriber`, `subscription`, `plan` (خطة فعالة مع التخصيصات المطبّقة).

### تعديل مشترك واشتراكه الجاري
- الطريقة: `PUT`
- المسار: `/api/admin/subscribers/:id`
- الهيدر: `Authorization` و`Content-Type: multipart/form-data`
- الحقول:
  - ملفات: `photo` أو `file` (صورة المشترك) — اختياري
  - جسم (حقول نصية) — كلها اختيارية:
    - `full_name`, `phone` (صيغة `05XXXXXXXX` مع منع التكرار)، `branch_id`
    - `subscription.plan_id` (يعيد حساب تاريخ الانتهاء حسب مدة الباقة)
    - `subscription.amount_paid`، `subscription.type` (`pickup|delivery|custom`)، `subscription.branch_id`
    - `subscription.delivery_branch_id` — إذا كان النوع `delivery` يجب إرسال رقم فرع التسليم صالح؛ إذا تغيّر النوع إلى غير `delivery` يتم تعيينه تلقائيًا إلى `null`
    - `subscription.customizations` (مصفوفة عناصر بنفس شكل الإضافة؛ تُستبدل بالكامل)
- المخرجات: `subscriber`, `subscription` (الحالي بعد التحديث), `plan` (الخطة الفعالة بعد التخصيص).

### قائمة المشتركين مع الاشتراك الحالي
- الطريقة: `GET`
- المسار: `/api/admin/subscribers?q=&subscriber_id=&branch_id=&status=ongoing|ended|paused|archived|all&type=pickup|delivery|custom|all&from=&to=&page=1&limit=10`
- المخرجات: صفوف تحتوي:
```json
{
  "subscriber": { "...بيانات المشترك..." },
  "current_subscription": { "...تفاصيل الاشتراك الجاري (إن وُجد)..." },
  "remaining_days": 5
}
```
- ملاحظة الفرع:
  - سوبر أدمن: يمكن تمرير `branch_id` لتصفية فرع معيّن أو تركه لجميع الفروع.
  - غير سوبر أدمن: يتم الحصر تلقائيًا على فرع المستخدم ولا تُقبل بيانات لفروع أخرى.

### معاينة مشترك
- الطريقة: `GET`
- المسار: `/api/admin/subscribers/:id/preview`
- المخرجات: `subscriber`, `current_subscription` (الجاري إن وجد), `plan` (الخطة الفعالة), `remaining_days`.

### معاينة اشتراك
- الطريقة: `GET`
- المسار: `/api/admin/subscriptions/:id/preview`
- المخرجات: `subscriber`، `current_subscription`، `plan`، `remaining_days`
- ملاحظة: إذا كان الاشتراك منتهيًا ستعود رسالة خطأ.

### إيقاف اشتراك مؤقتًا
- الطريقة: `PATCH`
- المسار: `/api/admin/subscriptions/:id/pause`
- المخرجات: الاشتراك بعد تغيير حالته إلى `paused` وتوثيق سجل الإيقاف.

### استئناف اشتراك
- الطريقة: `PATCH`
- المسار: `/api/admin/subscriptions/:id/resume`
- السلوك: يحتسب مدة الإيقاف ويضيفها إلى `end_date`، وتعود الحالة `ongoing`.

### تاريخ اشتراكات مشترك
- الطريقة: `GET`
- المسار: `/api/admin/subscribers/:id/subscriptions?page=1&limit=10`
- المخرجات: قائمة اشتراكات مع تفاصيل الباقة، مرقمة.

### سجلات الإيقاف لاشتراك
- الطريقة: `GET`
- المسار: `/api/admin/subscriptions/:id/pauses?page=1&limit=10`
- المخرجات: قائمة سجلات الإيقاف والاستئناف، مرقمة.

### تجديد اشتراك
- الطريقة: `POST`
- المسار: `/api/admin/subscribers/:id/renew`
- الجسم (JSON):
  - إجباري: `plan_id`
  - اختياري: `amount_paid`, `type` (`pickup|delivery|custom`), `branch_id`, `delivery_branch_id`, `customizations`
- السلوك:
  - إذا كان آخر اشتراك للمشترك منتهيًا: يُنشأ اشتراك `ongoing` بتاريخ بداية اليوم ونهاية حسب مدة الباقة.
  - إذا لم يكن منتهيًا:
    - إذا لا يوجد اشتراك `archived`: يُنشأ اشتراك بحالة `archived` وتواريخ `null`.
    - إذا يوجد اشتراك `archived`: يرجع خطأ "Archived subscription already exists".
  - عند انتهاء الاشتراكات تلقائيًا، يتم تفعيل المؤرشف ليصبح `ongoing` مع حساب تاريخ النهاية.
- مثال:
```json
{
  "plan_id": 4,
  "amount_paid": 250,
  "type": "delivery",
  "delivery_branch_id": 2,
  "customizations": [
    { "prev_meal_id": 7, "new_meal_id": 9, "quantity": 150, "unit_id": 1 }
  ]
}
```

### توثيق تسليم وجبات اشتراك
- الطريقة: `POST`
- المسار: `/api/admin/subscription-deliveries`
- الجسم:
  - مصفوفة عناصر مباشرة أو تحت المفتاح `items`
  - إجباري لكل عنصر: `subscription_id` (موحّد لكل العناصر), `meal_id`, `quantity`
- شروط:
  - الاشتراك من نوع `custom` وحالته `ongoing`.
  - تاريخ الانتهاء أكبر من تاريخ اليوم.
  - حد يومي للسحب من جدول الإعدادات `subscription_settings.max_daily_meal_withdrawal` (افتراضي `3`).
  - يتم احتساب إجمالي السحب اليومي عبر جميع الفروع لنفس الاشتراك (بدون تصفية فرع).
  - يتم تخزين `branch_id` لكل تسليم تلقائيًا كفرع المستخدم الذي نفّذ الطلب.
  - تحقق مقابل الخطة الفعالة أن كل وجبة لا تتجاوز الكمية المسموحة المتبقية.
- مثال:
```json
{
  "items": [
    { "subscription_id": 12, "meal_id": 5, "quantity": 1 },
    { "subscription_id": 12, "meal_id": 6, "quantity": 2 }
  ]
}
```
- المخرجات الطبيعية: `{ "delivered": 2, "subscription_id": 12 }`
- في حال تجاوز الحد اليومي:
```json
{
  "limit_exceeded": true,
  "today_deliveries": [
    { "id": 45, "subscription_id": 12, "meal": { "id": 5, "name": "صدر دجاج" }, "branch": { "id": 1, "name": "الفرع الرئيسي" }, "quantity": 1, "created_at": "2025-12-15T08:00:00Z" }
  ]
}
```

---

## المعلومات العامة (General Info)
- صلاحيات الشاشة: `GeneralInfo` (`view|edit`)

### جلب المعلومات العامة
- الطريقة: `GET`
- المسار: `/api/admin/general-info`
- المخرجات: صف معلومات واحد يتضمن: `org_name`, `restaurant_phone`, `restaurant_email`, `logo`, `primary_color`, `secondary_color`.

### تعديل المعلومات العامة
- الطريقة: `PUT`
- المسار: `/api/admin/general-info`
- الهيدر: `Authorization` و`Content-Type: multipart/form-data`
- الحقول:
  - ملفات: `logo` أو `photo` أو `file` — اختياري (سيتم حفظه في `uploads/general`)
  - جسم (حقول نصية) — اختيارية:
    - `org_name`
    - `restaurant_phone` بصيغة `05XXXXXXXX` (يتم التحقق)
    - `restaurant_email`
    - `primary_color`, `secondary_color` (قيم ألوان كنصوص)
- المخرجات: صف المعلومات بعد التحديث.

---

## البروفايل (Profile)
- بدون صلاحيات شاشة؛ أي مستخدم يمكنه إدارة بروفايله عبر التوكن.

### جلب البروفايل
- الطريقة: `GET`
- المسار: `/api/admin/me`
- المخرجات: بيانات المستخدم بدون `password` مع:
  - `role.permissions`
  - `branch`

### تعديل البروفايل
- الطريقة: `PUT`
- المسار: `/api/admin/me`
- الهيدر: `Authorization` و`Content-Type: multipart/form-data`
- الحقول:
  - ملفات: `photo` أو `file` — اختياري (يحفظ في `uploads/users`)
  - جسم (حقول نصية) — اختيارية:
    - `full_name`
    - `phone` بصيغة `05XXXXXXXX`
    - `username`
- المخرجات: بيانات المستخدم بعد التحديث بدون `password`.

### تغيير كلمة المرور
- الطريقة: `PUT`
- المسار: `/api/admin/me/password`
- الجسم (JSON):
```json
{ "old_password": "Old@123", "new_password": "New@123", "confirm_password": "New@123" }
```
- الشروط:
  - تطابق `new_password` و`confirm_password`.
  - صحة `old_password` بمقارنة مشفرة.
- المخرجات: رسالة نجاح.

---

## احصائيات الداشبورد (Dashboard)
- صلاحيات الشاشة: `Dashboard` (`view`)
- منطق الأفرع:
  - سوبر أدمن (`role_id = 1`): جميع الفروع.
  - غير سوبر أدمن: فرع المستخدم فقط.

### ملخص الاحصائيات
- الطريقة: `GET`
- المسار: `/api/admin/dashboard/stats`
- المخرجات:
```json
{
  "totalSubscribers": 120,
  "subscriptionGrowthRate": 18.75,
  "employeesCount": 25,
  "branchesCount": 4
}
```
- ملاحظة: `subscriptionGrowthRate` محسوب بمقارنة الاشتراكات المنشأة هذا الشهر مع الشهر السابق.

### آخر عشرة مشتركين
- الطريقة: `GET`
- المسار: `/api/admin/dashboard/latest-subscribers`
- المخرجات: قائمة حتى 10 عناصر:
```json
[
  { "subscriber_id": 55, "full_name": "سارة", "phone": "055...", "subscription_id": 210, "plan_name": "باقة أسبوعية", "end_date": "2025-12-30", "type": "pickup" }
]
```

---

## قائمة الاشتراكات (Subscriptions)
- الطريقة: `GET`
- المسار: `/api/admin/subscriptions?q=&branch_id=&status=ongoing|ended|paused|archived|all&type=pickup|delivery|custom&from=&to=&page=1&limit=10`
- الفلترة:
  - `q`: بحث في اسم المشترك أو هاتفه.
  - `branch_id`: يعمل فقط لسوبر أدمن؛ غير ذلك يُستخدم فرع المستخدم تلقائيًا.
  - `status`: حالة الاشتراك (`ongoing|ended|paused|archived|all`).
  - `type`: نوع الاشتراك (`pickup|delivery|custom|all`).
  - `from`, `to`: نطاق تاريخ البداية (`start_date`).
- هيكل الاستجابة:
```json
{
  "rows": [
    {
      "subscription": {
        "id": 8,
        "subscriber_id": 1,
        "plan_id": 8,
        "amount_paid": "29.78",
        "type": "pickup",
        "branch_id": 1,
        "delivery_branch_id": null,
        "status": "archived",
        "start_date": null,
        "end_date": null,
        "createdAt": "2025-12-17T10:01:29.851Z",
        "updatedAt": "2025-12-17T10:01:29.851Z",
        "subscriber": {
          "id": 1,
          "full_name": "محمد",
          "phone": "0555555555",
          "photo": "https://your-host/uploads/subscribers/1765824590433.jpeg",
          "branch_id": 1
        },
        "plan": {
          "id": 8,
          "name": "شسي",
          "image": "https://your-host/uploads/plans/1765817496801.jpeg",
          "price": "29.78",
          "duration_days": 30,
          "type": "normal",
          "status": "deleted"
        }
      },
      "is_current": false
    }
  ],
  "count": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```
- ملاحظات:
  - لا يوجد تكرار للبيانات في الجذر؛ تفاصيل المشترك والباقات داخل كائن `subscription` فقط.
  - حقول الصور (`photo`, `image`) تعود بروابط كاملة قابلة للوصول.

---

## ملاحظات الصور والملفات
- جميع الحقول `photo` و`image` تُعاد بروابط كاملة تعتمد على المضيف الحالي.
- يتم تحديد الأساس عبر `PUBLIC_BASE_URL` أو `BASE_URL` إن وُجدا؛ وإلا يُستخدم بروتوكول و`host` من الطلب.
- يتم تقديم الملفات الثابتة من المسار `/uploads` (خادم Express يقدّم `uploads` داخل مجلد المشروع).
- مثال تحويل:
  - الإدخال: `uploads/meals/123.jpg`
  - الإخراج: `https://<host>/uploads/meals/123.jpg`

---

## إعدادات الاشتراكات (Subscription Settings)
- صلاحيات الشاشة: `Subscribers` (`view|edit`)
- الحد الأقصى للسحب اليومي للوجبات لكل اشتراك.

### جلب الإعدادات
- الطريقة: `GET`
- المسار: `/api/admin/subscription-settings`
- المخرجات:
```json
{ "id": 1, "max_daily_meal_withdrawal": 3 }
```

### تعديل الإعدادات
- الطريقة: `PUT`
- المسار: `/api/admin/subscription-settings`
- الجسم (JSON):
```json
{ "max_daily_meal_withdrawal": 4 }
```
- الشروط:
  - قيمة صحيحة موجبة (`>= 1`).
- المخرجات:
```json
{ "id": 1, "max_daily_meal_withdrawal": 4 }
```

### المشتركين قريب انتهاء اشتراكهم
- الطريقة: `GET`
- المسار: `/api/admin/dashboard/near-expiry?page=1&limit=10`
- الشرط: اشتراكات `ongoing` وتنتهي خلال 5 أيام أو أقل.
- المخرجات:
```json
{
  "rows": [
    { "subscription_id": 210, "subscriber_id": 55, "full_name": "سارة", "phone": "055...", "branch": { "id": 1, "name": "الفرع الرئيسي" }, "plan_name": "باقة أسبوعية", "end_date": "2025-12-30", "days_remaining": 3, "type": "pickup" }
  ],
  "count": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### بحث اشتراك مشترك برقم الهاتف
- الطريقة: `GET`
- المسار: `/api/admin/dashboard/subscription-by-phone?phone=05XXXXXXXX`
- الصلاحية: `Dashboard` (`view`)
- المنطق:
  - إذا يوجد اشتراك حالي (حالته ليست `ended` وتاريخه `end_date >= تاريخ اليوم`): يعاد هذا الاشتراك.
  - إن لم يوجد اشتراك حالي: يعاد آخر اشتراك للمشترك.
  - إن لم يوجد أي اشتراك: تعاد القيم فارغة.
- المخرجات:
```json
{
  "subscriber": { "id": 1, "full_name": "محمد", "phone": "055...", "photo": "https://<host>/uploads/subscribers/..", "branch_id": 1 },
  "subscription": { "id": 8, "status": "ongoing", "start_date": "2025-12-01", "end_date": "2026-01-01", "type": "pickup", "plan_id": 3, "branch_id": 1 },
  "plan": {
    "id": 3,
    "name": "باقة أسبوعية",
    "image": "https://<host>/uploads/plans/..",
    "price": 199.99,
    "duration_days": 7,
    "type": "normal",
    "status": "active",
    "plan_meals": [
      { "meal_id": 5, "name": "صدر دجاج", "image": "https://<host>/uploads/meals/..", "quantity": 200, "unit": { "id": 1, "name": "جرام" }, "workday": { "id": 3, "name_ar": "الثلاثاء", "name_en": "Tuesday" } }
    ]
  },
  "is_current": true
}
```
- ملاحظات:
  - للمستخدم غير سوبر أدمن، البحث محصور بفرعه فقط.
  - صور `photo` و`image` تُعاد بروابط كاملة.

### عمليات الداشبورد المتعلقة بالمشتركين
- تستخدم نفس منطق كنترولرات إدارة المشتركين والاشتراكات مع اختلاف صلاحيات الشاشة إلى `Dashboard`.

#### إضافة مشترك من الداشبورد
- الطريقة: `POST`
- المسار: `/api/admin/dashboard/subscribers`
- الصلاحية: `Dashboard` (`add`)
- الرفع: `multipart/form-data` (حقول `photo` أو `file`)
- الجسم: نفس حقول إضافة المشترك في قسم المشتركين
- المخرجات: `subscriber`, `subscription`, `plan`

#### توثيق تسليم وجبة من الداشبورد
- الطريقة: `POST`
- المسار: `/api/admin/dashboard/subscription-deliveries`
- الصلاحية: `Dashboard` (`edit`)
- الجسم: نفس مواصفات توثيق التسليم في قسم الاشتراكات
- الشروط: نفس الشروط الموثقة (نوع `custom`, حالة `ongoing`, حد يومي، إلخ)

#### تجديد اشتراك من الداشبورد
- الطريقة: `POST`
- المسار: `/api/admin/dashboard/subscribers/:id/renew`
- الصلاحية: `Dashboard` (`edit`)
- الجسم: نفس مواصفات تجديد الاشتراك في قسم الاشتراكات
- السلوك: مطابق للمذكور في قسم الاشتراكات

