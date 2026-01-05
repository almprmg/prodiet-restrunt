const { Subscriber, Subscription, Plan, PlanMeal, Meal, Unit, Workday, SubscriptionCustomization, SubscriptionPause, SubscriptionDelivery, SubscriptionDeliveryDetail, SubscriptionSetting, SubscriptionAddon, Category, Branch, User, sequelize } = require('../../../models');
const { Op } = require('sequelize');
const { validatePhone05, addDays, calculateRemainingDays, calculatePausedDays, normalizeArrayInput } = require('../../utils/helpers.util');
const { isSuperAdminUser, getRequesterBranchId } = require('../../utils/common.util');
const { ensureExpiryScheduler, processExpiryAndActivateRenewals } = require('../../utils/scheduler.util');

async function createSubscriberWithSubscription(payload, createdBy, photoPath) {
  return await sequelize.transaction(async (t) => {
    const name = payload.full_name;
    const phone = payload.phone;
    const branchId = await getRequesterBranchId(createdBy);
    if (!name) throw new Error('Field full_name is required');
    if (!phone) throw new Error('Field phone is required');
    if (!validatePhone05(phone)) throw new Error('Invalid phone format');
    const existsPhone = await Subscriber.findOne({ where: { phone }, transaction: t });
    if (existsPhone) throw new Error('Phone already exists');
    const branch = await Branch.findByPk(branchId, { transaction: t });
    if (!branch) throw new Error('Branch not found');
    const planId = payload.subscription?.plan_id;
    const amountPaid = Number(payload.subscription?.amount_paid || 0);
    const subType = payload.subscription?.type || 'pickup';
    const subBranchId = branchId;
    if (!planId) throw new Error('Subscription plan_id is required');
    const plan = await Plan.findOne({ where: { id: planId, status: { [Op.in]: ['active', 'inactive'] } }, transaction: t });
    if (!plan) throw new Error('Plan not found');
    if (!['pickup', 'delivery', 'custom'].includes(subType)) throw new Error('Invalid subscription type');
    let deliveryBranchId = null;
    let deliveryFee = 0;
    if (subType === 'pickup') {
      deliveryBranchId = Number(payload.subscription?.delivery_branch_id);
      if (!Number.isInteger(deliveryBranchId) || deliveryBranchId <= 0) throw new Error('delivery_branch_id is required for pickup type');
      const deliveryBranch = await Branch.findByPk(deliveryBranchId, { transaction: t });
      if (!deliveryBranch) throw new Error('delivery branch not found');
      if (deliveryBranch.status !== 'active' || deliveryBranch.is_active === false) throw new Error('Delivery branch inactive');
    } else if (subType === 'delivery') {
      deliveryFee = Number(payload.subscription?.delivery_fee);
      if (!Number.isFinite(deliveryFee) || deliveryFee < 0) throw new Error('رسوم التوصيل مطلوبة لنوع التوصيل');
    }
    const today = new Date();
    const endDate = addDays(today, plan.duration_days);

    const subscriber = await Subscriber.create(
      {
        full_name: name,
        phone,
        photo: photoPath || null,
        branch_id: branchId,
        created_by: createdBy,
      },
      { transaction: t }
    );

    const subscription = await Subscription.create(
      {
        subscriber_id: subscriber.id,
        plan_id: planId,
        amount_paid: amountPaid,
        type: subType,
        branch_id: subBranchId,
        delivery_branch_id: deliveryBranchId,
        delivery_fee: deliveryFee || 0,
        status: 'ongoing',
        start_date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        end_date: endDate,
      },
      { transaction: t }
    );

    const customizations = normalizeArrayInput(payload.subscription?.customizations);
    if (customizations.length > 0) {
      const rows = [];
      for (const c of customizations) {
        const prevMealId = Number(c.prev_meal_id);
        const newMealId = Number(c.new_meal_id);
        if (!Number.isInteger(prevMealId) || prevMealId <= 0) throw new Error('Invalid prev_meal_id');
        if (!Number.isInteger(newMealId) || newMealId <= 0) throw new Error('Invalid new_meal_id');
        const prevMeal = await Meal.findOne({ where: { id: prevMealId, state: 0 }, transaction: t });
        const newMeal = await Meal.findOne({ where: { id: newMealId, state: 0 }, transaction: t });
        if (!prevMeal || !newMeal) throw new Error('Meal not found');
        const pmRow = await PlanMeal.findOne({ where: { plan_id: plan.id, meal_id: newMealId }, transaction: t });
        const proteinQty = pmRow ? Number(pmRow.protein_quantity) : null;
        const carbsQty = pmRow ? Number(pmRow.carbs_quantity) : null;
        let allowedCount = null;
        if (subType === 'custom') {
          if (c.allowed_meals_count !== undefined && c.allowed_meals_count !== null && c.allowed_meals_count !== '') {
            const ac = Number(c.allowed_meals_count);
            if (!Number.isInteger(ac) || ac <= 0) throw new Error('allowed_meals_count غير صالح');
            allowedCount = ac;
          } else {
            const pmPrev = await PlanMeal.findOne({ where: { plan_id: plan.id, meal_id: prevMealId }, transaction: t });
            allowedCount = pmPrev ? Number(pmPrev.allowed_meals_count || 0) : null;
          }
        }
        rows.push({
          subscription_id: subscription.id,
          plan_id: plan.id,
          prev_meal_id: prevMealId,
          new_meal_id: newMealId,
          protein_quantity: proteinQty,
          carbs_quantity: carbsQty,
          allowed_meals_count: allowedCount,
        });
      }
      await SubscriptionCustomization.bulkCreate(rows, { transaction: t });
    }

    const addons = normalizeArrayInput(payload.subscription?.addons);
    if (addons.length > 0) {
      const addonRows = [];
      for (const a of addons) {
        const categoryId = Number(a.category_id);
        const price = Number(a.price || 0);
        if (!Number.isInteger(categoryId) || categoryId <= 0) throw new Error('رقم الصنف غير صالح');
        const category = await Category.findOne({ where: { id: categoryId, status: 'active' }, transaction: t });
        if (!category) throw new Error('الصنف غير موجود أو محذوف');
        if (!Number.isFinite(price) || price < 0) throw new Error('سعر الإضافة غير صالح');
        addonRows.push({ subscription_id: subscription.id, category_id: categoryId, price });
      }
      await SubscriptionAddon.bulkCreate(addonRows, { transaction: t });
    }

    const effectivePlan = await buildEffectivePlanForSubscription(subscription.id, t);
    ensureExpiryScheduler();
    return { subscriber, subscription, plan: effectivePlan };
  });
}

async function updateSubscriberAndSubscription(subscriberId, payload, photoPath) {
  return await sequelize.transaction(async (t) => {
    const subscriber = await Subscriber.findByPk(subscriberId, { transaction: t });
    if (!subscriber) throw new Error('المشترك غير موجود');
    const updates = {};
    if (payload.full_name !== undefined) updates.full_name = payload.full_name;
    if (payload.phone !== undefined) {
      if (!validatePhone05(payload.phone)) throw new Error('صيغة رقم الهاتف غير صحيحة');
      const exists = await Subscriber.findOne({ where: { phone: payload.phone, id: { [Op.ne]: subscriberId } }, transaction: t });
      if (exists) throw new Error('رقم الهاتف مستخدم مسبقًا');
      updates.phone = payload.phone;
    }
    if (photoPath !== undefined) updates.photo = photoPath;
    await subscriber.update(updates, { transaction: t });

    const currentSub = await Subscription.findOne({ where: { subscriber_id: subscriberId, status: 'ongoing' }, transaction: t });
    if (!currentSub) throw new Error('لا يوجد اشتراك نشط للتعديل');
    const effectivePlan = await buildEffectivePlanForSubscription(currentSub.id, t);
    ensureExpiryScheduler();
    await processExpiryAndActivateRenewals();
    return { subscriber, subscription: await Subscription.findByPk(currentSub.id), plan: effectivePlan };
  });
}

async function updateSubscriptionDeliveryBranch(subscriptionId, newBranchId, requesterId) {
  return await sequelize.transaction(async (t) => {
    const subscription = await Subscription.findByPk(subscriptionId, { transaction: t });
    if (!subscription) throw new Error('الاشتراك غير موجود');
    if (subscription.type !== 'pickup') throw new Error('لا يمكن تعديل فرع الاستلام لأن نوع الاشتراك ليس استلام');
    const dbid = Number(newBranchId);
    if (!Number.isInteger(dbid) || dbid <= 0) throw new Error('رقم فرع الاستلام غير صالح');
    const dbr = await Branch.findByPk(dbid, { transaction: t });
    if (!dbr) throw new Error('فرع الاستلام غير موجود');
    await subscription.update({ delivery_branch_id: dbid }, { transaction: t });
    return subscription;
  });
}

async function normalPauseSubscription(subscriptionId, startDate, days) {
  return await sequelize.transaction(async (t) => {
    const subscription = await Subscription.findByPk(subscriptionId, { transaction: t });
    if (!subscription) throw new Error('الاشتراك غير موجود');
    if (subscription.status === 'paused') throw new Error('لا يمكن إيقاف اشتراك موقوف مسبقًا');
    if (subscription.status === 'ended') throw new Error('لا يمكن إيقاف اشتراك منتهي');
    const dInt = Number(days);
    if (!Number.isInteger(dInt) || dInt <= 0) throw new Error('عدد أيام الإيقاف غير صالح');
    const start = new Date(startDate);
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const afterNext = new Date(todayOnly.getFullYear(), todayOnly.getMonth(), todayOnly.getDate() + 2);
    const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    if (startOnly.getTime() < afterNext.getTime()) {
      throw new Error('غير مسموح بتاريخ بداية اليوم الحالي أو التالي أو قبل اليوم؛ يسمح فقط من اليوم الذي يلي اليوم التالي وما بعده');
    }
    const yyyy = todayOnly.getFullYear();
    const mm = String(todayOnly.getMonth() + 1).padStart(2, '0');
    const dd = String(todayOnly.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const hasEmergencyPause = await SubscriptionPause.findOne({
      where: { subscription_id: subscriptionId, resume_type: 'emergency', resume_date: { [Op.is]: null } },
      transaction: t,
    });
    if (hasEmergencyPause) {
      throw new Error('الاشتراك لديه إيقاف طارئ قائم، لا يمكن جدولة إيقاف جديد');
    }
    const hasUnfinishedPause = await SubscriptionPause.findOne({
      where: { subscription_id: subscriptionId, resume_type: 'normal', resume_date: { [Op.gt]: todayStr } },
      transaction: t,
    });
    if (hasUnfinishedPause) {
      throw new Error('يوجد إيقاف مجدول أو قائم لم ينته بعد لهذا الاشتراك');
    }
    const existingPauses = await SubscriptionPause.findAll({ where: { subscription_id: subscriptionId, resume_type: 'normal' }, transaction: t });
    const usedDays = existingPauses.reduce((acc, p) => acc + (Number(p.pause_days_requested) || 0), 0);
    const settings = await SubscriptionSetting.findOne({ transaction: t });
    const maxDays = settings ? Number(settings.max_pause_days || 7) : 7;
    const totalRequested = usedDays + dInt;
    if (totalRequested > maxDays) {
      const remaining = Math.max(0, maxDays - usedDays);
      throw new Error(`تجاوزت الحد الأقصى لأيام الإيقاف (${maxDays})، المتاح لك ${remaining} يوم`);
    }
    const resumeDate = new Date(startOnly.getFullYear(), startOnly.getMonth(), startOnly.getDate() + dInt);
    await SubscriptionPause.create(
      {
        subscription_id: subscriptionId,
        pause_date: startOnly,
        resume_date: resumeDate,
        pause_days_requested: dInt,
        resume_type: 'normal',
      },
      { transaction: t }
    );
    ensureExpiryScheduler();
    return subscription;
  });
}

async function buildEffectivePlanForSubscription(subscriptionId, transaction) {
  const sub = await Subscription.findByPk(subscriptionId, { transaction });
  if (!sub) throw new Error('Subscription not found');
  const plan = await Plan.findByPk(sub.plan_id, {
    include: [
      {
        model: PlanMeal,
        as: 'plan_meals',
        include: [
          { model: Meal, as: 'meal' },
          { model: Workday, as: 'workday' },
        ],
      },
    ],
    transaction,
  });
  const customs = await SubscriptionCustomization.findAll({ where: { subscription_id: sub.id }, transaction });
  const map = new Map();
  customs.forEach((c) => map.set(c.prev_meal_id, c.new_meal_id));
  const type = plan.type;
  const group = new Map();
  const mealIds = new Set();
  for (const pm of plan.plan_meals) {
    const json = pm.toJSON();
    const effMealId = map.get(json.meal_id) || json.meal_id;
    const workdayId = json.workday_id || (json.workday ? json.workday.id : null);
    const allowed = Number(json.allowed_meals_count || 0);
    const key = type === 'normal' ? `${workdayId || 'null'}:${effMealId}` : `${effMealId}`;
    const existing = group.get(key);
    if (existing) {
      group.set(key, { ...existing, allowed_meals_count: Number(existing.allowed_meals_count) + (Number.isFinite(allowed) ? allowed : 0) });
    } else {
      group.set(key, {
        meal_id: effMealId,
        allowed_meals_count: Number.isFinite(allowed) ? allowed : 0,
        workday: json.workday
          ? { id: json.workday.id, name_ar: json.workday.name_ar, name_en: json.workday.name_en }
          : null,
      });
    }
    mealIds.add(effMealId);
  }
  const mealsLookup = await Meal.findAll({ where: { id: Array.from(mealIds) }, transaction });
  const mealMap = new Map();
  mealsLookup.forEach((m) => mealMap.set(m.id, m.toJSON()));
  const effectiveMeals = Array.from(group.values()).map((it) => {
    const m = mealMap.get(it.meal_id) || null;
    return {
      meal_id: it.meal_id,
      name: m ? m.name : null,
      image: m ? m.image : null,
      description: m ? m.description : null,
      meal_type: m ? m.meal_type : null,
      garnish_category_id: m ? m.garnish_category_id : null,
      allowed_meals_count: it.allowed_meals_count,
      workday: it.workday,
    };
  });
  return {
    id: plan.id,
    name: plan.name,
    image: plan.image,
    price: plan.price,
    duration_days: plan.duration_days,
    description: plan.description,
    type: plan.type,
    status: plan.status,
    protein_quantity: plan.protein_quantity,
    carbs_quantity: plan.carbs_quantity,
    total_meals_count: plan.total_meals_count,
    breakfasts_count: plan.breakfasts_count,
    lunches_count: plan.lunches_count,
    dinners_count: plan.dinners_count,
    plan_meals: effectiveMeals,
  };
}

async function documentSubscriptionDeliveries(subscriptionId, items, requesterId) {
  if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) throw new Error('رقم الاشتراك غير صالح');
  if (!Array.isArray(items) || items.length === 0) throw new Error('قائمة العناصر مطلوبة');
  const superAdmin = await isSuperAdminUser(requesterId);
  const requesterBranchId = await getRequesterBranchId(requesterId);
  const subscription = await Subscription.findByPk(subscriptionId);
  if (!subscription) throw new Error('الاشتراك غير موجود');
  // if (!superAdmin && subscription.branch_id !== requesterBranchId) throw new Error('Forbidden branch');
  if (subscription.type !== 'custom') throw new Error('يسمح فقط للاشتراكات المخصصة');
  if (subscription.status !== 'ongoing') throw new Error('الاشتراك ليس نشطًا');
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(subscription.end_date);
  if (!(end.getTime() > todayStart.getTime())) throw new Error('انتهى الاشتراك أو ينتهي اليوم');

  const setting = await SubscriptionSetting.findOne();
  const maxDaily = setting && Number.isInteger(setting.max_daily_meal_withdrawal) ? setting.max_daily_meal_withdrawal : 3;
  const sumRequested = items.reduce((acc, it) => {
    const q = Number(it.quantity);
    return acc + (Number.isFinite(q) && q > 0 ? q : 0);
  }, 0);
  const sumDeliveredTodayRow = await SubscriptionDeliveryDetail.findOne({
    attributes: [[sequelize.fn('SUM', sequelize.col('SubscriptionDeliveryDetail.quantity')), 'total']],
    include: [
      {
        model: SubscriptionDelivery,
        as: 'delivery',
        attributes: [],
        where: {
          subscription_id: subscriptionId,
          created_at: {
            [Op.gte]: todayStart,
            [Op.lt]: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
          },
        },
      },
    ],
    raw: true,
  });
  const deliveredToday = Number((sumDeliveredTodayRow && sumDeliveredTodayRow.total) || 0);
  if (sumRequested + deliveredToday > maxDaily) {
    const todayDeliveries = await SubscriptionDelivery.findAll({
      where: {
        subscription_id: subscriptionId,
        created_at: {
          [Op.gte]: todayStart,
          [Op.lt]: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
      order: [['id', 'DESC']],
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
        {
          model: SubscriptionDeliveryDetail,
          as: 'details',
          include: [{ model: Meal, as: 'meal', attributes: ['id', 'name'] }],
        },
      ],
    });
    return {
      limit_exceeded: true,
      max_daily: maxDaily,
      requested_sum: sumRequested,
      delivered_today: deliveredToday,
      today_deliveries: todayDeliveries,
    };
  }

  const planEffective = await buildEffectivePlanForSubscription(subscriptionId);
  const planQtyMap = new Map();
  const mealNameMap = new Map();
  planEffective.plan_meals.forEach((pm) => {
    const key = pm.meal_id;
    const qty = Number(pm.allowed_meals_count);
    planQtyMap.set(key, (planQtyMap.get(key) || 0) + (Number.isFinite(qty) ? qty : 0));
    if (pm && pm.meal_id) {
      mealNameMap.set(pm.meal_id, pm.name || null);
    }
  });
  const requestedByMeal = new Map();
  for (const it of items) {
    const mid = Number(it.meal_id);
    const q = Number(it.quantity);
    if (Number.isInteger(mid) && mid > 0 && Number.isFinite(q) && q > 0) {
      requestedByMeal.set(mid, (requestedByMeal.get(mid) || 0) + q);
    }
  }
  const requestedMealIds = Array.from(requestedByMeal.keys());
  const missingMeals = requestedMealIds.filter((mid) => !mealNameMap.has(mid));
  if (missingMeals.length > 0) {
    const mealsLookup = await Meal.findAll({ where: { id: { [Op.in]: missingMeals }, state: 0 } });
    mealsLookup.forEach((m) => {
      const json = m.toJSON ? m.toJSON() : m;
      mealNameMap.set(json.id, json.name || null);
    });
  }
  const deliveredAll = await SubscriptionDeliveryDetail.findAll({
    attributes: [
      [sequelize.col('SubscriptionDeliveryDetail.meal_id'), 'meal_id'],
      [sequelize.fn('SUM', sequelize.col('SubscriptionDeliveryDetail.quantity')), 'total'],
    ],
    include: [{ model: SubscriptionDelivery, as: 'delivery', attributes: [], where: { subscription_id: subscriptionId } }],
    group: ['SubscriptionDeliveryDetail.meal_id'],
    raw: true,
  });
  const deliveredMap = new Map();
  deliveredAll.forEach((row) => {
    deliveredMap.set(Number(row.meal_id), Number(row.total));
  });
  const errors = [];
  for (const [mid, qtySum] of requestedByMeal.entries()) {
    if (!planQtyMap.has(mid)) {
      errors.push({ meal_id: mid, meal_name: mealNameMap.get(mid) || null, error: 'الوجبة غير موجودة في الباقة' });
      continue;
    }
    const allowed = planQtyMap.get(mid);
    const already = deliveredMap.get(mid) || 0;
    const remaining = Math.max(0, allowed - already);
    if (qtySum > remaining) {
      errors.push({ meal_id: mid, meal_name: mealNameMap.get(mid) || null, remaining });
    }
  }
  if (errors.length > 0) {
    const parts = errors.map((e) => {
      if (e.remaining !== undefined) {
        return `تجاوزت الحد للوجبة ${e.meal_name ?? e.meal_id}؛ الباقي لك ${e.remaining} فقط`;
      }
      if (e.error) {
        if (e.meal_name) return `لم يتم توثيق الوجبة ${e.meal_name}؛ ${e.error}`;
        if (e.meal_id && Number.isFinite(e.meal_id)) return `لم يتم توثيق الوجبة ${e.meal_id}؛ ${e.error}`;
        return `لم يتم التوثيق؛ ${e.error}`;
      }
      return 'لم يتم التوثيق؛ خطأ غير معروف';
    });
    const msg = parts.join('، ');
    throw new Error(msg);
  }

  return await sequelize.transaction(async (t) => {
    const header = await SubscriptionDelivery.create(
      {
        subscription_id: subscriptionId,
        branch_id: requesterBranchId,
      },
      { transaction: t }
    );
    const rows = items.map((it) => ({
      delivery_id: header.id,
      meal_id: Number(it.meal_id),
      quantity: Number(it.quantity),
    }));
    await SubscriptionDeliveryDetail.bulkCreate(rows, { transaction: t });
    return true;
  });
}

async function listSubscribersWithCurrentSubscription({ q,  branch_id, status = 'all', type = 'all', from, to, page = 1, limit = 10 }, requesterId) {
  const superAdmin = await isSuperAdminUser(requesterId);
  const requesterBranchId = await getRequesterBranchId(requesterId);
  const whereSubscriber = {};
  if (q) {
    whereSubscriber[Op.or] = [
      { full_name: { [Op.iLike]: `%${q}%` } },
      { phone: { [Op.iLike]: `%${q}%` } },
    ];
  }
  if (!superAdmin) {
    whereSubscriber.branch_id = requesterBranchId;
  } else if (branch_id) {
    whereSubscriber.branch_id = branch_id;
  }
  const whereSub = {};
  if (status && status !== 'all') whereSub.status = status;
  if (type && type !== 'all') whereSub.type = type;
  const range = {};
  if (from) range[Op.gte] = new Date(from);
  const toDate = to ? new Date(to) : new Date();
  if (toDate) range[Op.lte] = toDate;
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const { rows, count } = await Subscriber.findAndCountAll({
    where: whereSubscriber,
    offset,
    limit: safeLimit,
    order: [['id', 'ASC']],
    include: [
      {
        model: Subscription,
        as: 'subscriptions',
        where: whereSub,
        required: false,
      },
    ],
  });
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const data = [];
  for (const s of rows) {
    const subsDetailed = [];
    for (const sub of s.subscriptions || []) {
      const isCurrent = sub.status !== 'ended' && sub.end_date && new Date(sub.end_date).getTime() >= todayStart.getTime();
      const remaining_days = sub.end_date ? calculateRemainingDays(sub.end_date) : null;
      const plan = await buildEffectivePlanForSubscription(sub.id);
      const addons = await SubscriptionAddon.findAll({ where: { subscription_id: sub.id }, include: [{ model: Category, as: 'category' }] });
      const subObj = sub.toJSON ? sub.toJSON() : sub;
      subObj.is_current = isCurrent;
      subObj.remaining_days = remaining_days;
      subObj.plan = plan;
      subsDetailed.push({ subscription: subObj, addons });
    }
    const subscriberObj = s.toJSON ? s.toJSON() : s;
    subscriberObj.subscriptions = subsDetailed;
    data.push({ subscriber: subscriberObj });
  }
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows: data, count, page: safePage, limit: safeLimit, totalPages };
}

async function getPreviewBySubscriberId(subscriberId) {
  const subscriber = await Subscriber.findByPk(subscriberId, { include: [{ model: Branch, as: 'branch' }] });
  if (!subscriber) throw new Error('Subscriber not found');
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const subscription = await Subscription.findOne({
    where: {
      subscriber_id: subscriberId,
      status: { [Op.in]: ['ongoing', 'paused'] },
      end_date: { [Op.gte]: todayStart },
    },
    order: [['id', 'DESC']],
  });
  if (!subscription) return { subscriber, subscription: null, plan: null };
  const plan = await buildEffectivePlanForSubscription(subscription.id);
  const remaining_days = calculateRemainingDays(subscription.end_date);
  const isCurrent = subscription.status !== 'ended' && subscription.end_date && new Date(subscription.end_date).getTime() >= todayStart.getTime();
  const addons = await SubscriptionAddon.findAll({ where: { subscription_id: subscription.id }, include: [{ model: Category, as: 'category' }] });
  let delivery_branch = null;
  if (subscription.type === 'pickup' && subscription.delivery_branch_id) {
    const dbr = await Branch.findByPk(subscription.delivery_branch_id);
    if (dbr) {
      const j = dbr.toJSON ? dbr.toJSON() : dbr;
      delivery_branch = { id: j.id, name: j.name };
    }
  }
  const subObj = subscription.toJSON ? subscription.toJSON() : subscription;
  subObj.is_current = isCurrent;
  subObj.remaining_days = remaining_days;
  subObj.addons = addons;
  subObj.delivery_branch = delivery_branch;
  return { subscriber, subscription: subObj, plan };
}

async function getPreviewBySubscriptionId(subscriptionId) {
  const subscription = await Subscription.findByPk(subscriptionId, { include: [{ model: Subscriber, as: 'subscriber' }] });
  if (!subscription) throw new Error('الاشتراك غير موجود');
  const plan = await buildEffectivePlanForSubscription(subscriptionId);
  const remaining_days = calculateRemainingDays(subscription.end_date);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isCurrent = subscription.status !== 'ended' && subscription.end_date && new Date(subscription.end_date).getTime() >= todayStart.getTime();
  const addons = await SubscriptionAddon.findAll({ where: { subscription_id: subscriptionId }, include: [{ model: Category, as: 'category' }] });
  const subObj = subscription.toJSON ? subscription.toJSON() : subscription;
  subObj.plan = plan;
  subObj.addons = addons;
  subObj.is_current = isCurrent;
  subObj.remaining_days = remaining_days;
  return { subscription: subObj };
}

async function pauseSubscription(subscriptionId) {
  return await sequelize.transaction(async (t) => {
    const subscription = await Subscription.findByPk(subscriptionId, { transaction: t });
    if (!subscription || subscription.status !== 'ongoing') throw new Error('Subscription not eligible for pause');
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yyyy = todayOnly.getFullYear();
    const mm = String(todayOnly.getMonth() + 1).padStart(2, '0');
    const dd = String(todayOnly.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const hasEmergencyPause = await SubscriptionPause.findOne({
      where: { subscription_id: subscriptionId, resume_type: 'emergency', resume_date: { [Op.is]: null } },
      transaction: t,
    });
    if (hasEmergencyPause) throw new Error('يوجد إيقاف طارئ قائم لهذا الاشتراك');
    const hasNormalUnfinished = await SubscriptionPause.findOne({
      where: { subscription_id: subscriptionId, resume_type: 'normal', resume_date: { [Op.gt]: todayStr } },
      transaction: t,
    });
    if (hasNormalUnfinished) throw new Error('يوجد إيقاف عادي غير منتهٍ لهذا الاشتراك');
    await SubscriptionPause.create({ subscription_id: subscriptionId, pause_date: today, resume_type: 'emergency' }, { transaction: t });
    await subscription.update({ status: 'paused' }, { transaction: t });
    return subscription;
  });
}

async function resumeSubscription(subscriptionId) {
  return await sequelize.transaction(async (t) => {
    const subscription = await Subscription.findByPk(subscriptionId, { transaction: t });
    if (!subscription || subscription.status !== 'paused') throw new Error('Subscription not eligible for resume');
    const lastPause = await SubscriptionPause.findOne({
      where: { subscription_id: subscriptionId, resume_type: 'emergency', resume_date: { [Op.is]: null } },
      order: [['id', 'DESC']],
      transaction: t,
    });
    if (!lastPause) throw new Error('Pause record not found');
    const today = new Date();
    const pausedDays = calculatePausedDays(lastPause.pause_date, today);
    const newEnd = addDays(subscription.end_date, pausedDays);
    await lastPause.update({ resume_date: today }, { transaction: t });
    await subscription.update({ status: 'ongoing', end_date: newEnd }, { transaction: t });
    ensureExpiryScheduler();
    return subscription;
  });
}

async function renewSubscription(subscriberId, payload, requesterId) {
  return await sequelize.transaction(async (t) => {
    const subscriber = await Subscriber.findByPk(subscriberId, { transaction: t });
    if (!subscriber) throw new Error('Subscriber not found');
    const superAdmin = await isSuperAdminUser(requesterId);
    const requesterBranchId = await getRequesterBranchId(requesterId);
    const planId = Number(payload.plan_id);
    const amountPaid = Number(payload.amount_paid || 0);
    const subType = payload.type || 'pickup';
    const branchId = requesterBranchId;
    if (!Number.isInteger(planId) || planId <= 0) throw new Error('Subscription plan_id is required');
    const plan = await Plan.findOne({ where: { id: planId, status: { [Op.in]: ['active', 'inactive'] } }, transaction: t });
    if (!plan) throw new Error('Plan not found');
    if (!['pickup', 'delivery', 'custom'].includes(subType)) throw new Error('Invalid subscription type');
    // الفرع يؤخذ تلقائيًا من منفذ الطلب
    let deliveryBranchId = null;
    let deliveryFee = 0;
    if (subType === 'pickup') {
      deliveryBranchId = Number(payload.delivery_branch_id);
      if (!Number.isInteger(deliveryBranchId) || deliveryBranchId <= 0) throw new Error('delivery_branch_id is required for pickup type');
      const deliveryBranch = await Branch.findByPk(deliveryBranchId, { transaction: t });
      if (!deliveryBranch) throw new Error('Delivery branch not found');
    } else if (subType === 'delivery') {
      deliveryFee = Number(payload.delivery_fee);
      if (!Number.isFinite(deliveryFee) || deliveryFee < 0) throw new Error('رسوم التوصيل مطلوبة لنوع التوصيل');
    }

    const lastSub = await Subscription.findOne({ where: { subscriber_id: subscriberId }, order: [['id', 'DESC']], transaction: t });
    const customs = normalizeArrayInput(payload.customizations);
    const addons = normalizeArrayInput(payload.addons);

    if (!lastSub || lastSub.status === 'ended') {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endDate = addDays(startDate, plan.duration_days);
      const subscription = await Subscription.create(
        {
          subscriber_id: subscriberId,
          plan_id: planId,
          amount_paid: amountPaid,
          type: subType,
          branch_id: branchId,
          delivery_branch_id: deliveryBranchId,
          delivery_fee: deliveryFee || 0,
          status: 'ongoing',
          start_date: startDate,
          end_date: endDate,
        },
        { transaction: t }
      );
      if (customs.length > 0) {
        const rows = [];
        for (const c of customs) {
          const prevMealId = Number(c.prev_meal_id);
          const newMealId = Number(c.new_meal_id);
          if (!Number.isInteger(prevMealId) || prevMealId <= 0) throw new Error('Invalid prev_meal_id');
          if (!Number.isInteger(newMealId) || newMealId <= 0) throw new Error('Invalid new_meal_id');
          const prevMeal = await Meal.findOne({ where: { id: prevMealId, state: 0 }, transaction: t });
          const newMeal = await Meal.findOne({ where: { id: newMealId, state: 0 }, transaction: t });
          if (!prevMeal || !newMeal) throw new Error('Meal not found');
          const pmRow = await PlanMeal.findOne({ where: { plan_id: plan.id, meal_id: newMealId }, transaction: t });
          const proteinQty = pmRow ? Number(pmRow.protein_quantity) : null;
          const carbsQty = pmRow ? Number(pmRow.carbs_quantity) : null;
          let allowedCount = null;
          if (subType === 'custom') {
            if (c.allowed_meals_count !== undefined && c.allowed_meals_count !== null && c.allowed_meals_count !== '') {
              const ac = Number(c.allowed_meals_count);
              if (!Number.isInteger(ac) || ac <= 0) throw new Error('allowed_meals_count غير صالح');
              allowedCount = ac;
            } else {
              const pmPrev = await PlanMeal.findOne({ where: { plan_id: plan.id, meal_id: prevMealId }, transaction: t });
              allowedCount = pmPrev ? Number(pmPrev.allowed_meals_count || 0) : null;
            }
          }
          rows.push({
            subscription_id: subscription.id,
            plan_id: plan.id,
            prev_meal_id: prevMealId,
            new_meal_id: newMealId,
            protein_quantity: proteinQty,
            carbs_quantity: carbsQty,
            allowed_meals_count: allowedCount,
          });
        }
        await SubscriptionCustomization.bulkCreate(rows, { transaction: t });
      }
      // إضافات الاشتراك
      if (addons.length > 0) {
        const addonRows = [];
        for (const a of addons) {
          const categoryId = Number(a.category_id);
          const price = Number(a.price || 0);
          if (!Number.isInteger(categoryId) || categoryId <= 0) throw new Error('رقم الصنف غير صالح');
          const category = await Category.findOne({ where: { id: categoryId, status: 'active' }, transaction: t });
          if (!category) throw new Error('الصنف غير موجود أو محذوف');
          if (!Number.isFinite(price) || price < 0) throw new Error('سعر الإضافة غير صالح');
          addonRows.push({ subscription_id: subscription.id, category_id: categoryId, price });
        }
        await SubscriptionAddon.bulkCreate(addonRows, { transaction: t });
      }
      ensureExpiryScheduler();
      const effectivePlan = await buildEffectivePlanForSubscription(subscription.id, t);
      return { subscriber, subscription, plan: effectivePlan };
    } else {
      const archivedExists = await Subscription.findOne({ where: { subscriber_id: subscriberId, status: 'archived' }, transaction: t });
      if (archivedExists) throw new Error('Archived subscription already exists');
      const subscription = await Subscription.create(
        {
          subscriber_id: subscriberId,
          plan_id: planId,
          amount_paid: amountPaid,
          type: subType,
          branch_id: branchId,
          delivery_branch_id: deliveryBranchId,
          delivery_fee: deliveryFee || 0,
          status: 'archived',
          start_date: null,
          end_date: null,
        },
        { transaction: t }
      );
      if (customs.length > 0) {
        const rows = [];
        for (const c of customs) {
          const prevMealId = Number(c.prev_meal_id);
          const newMealId = Number(c.new_meal_id);
          if (!Number.isInteger(prevMealId) || prevMealId <= 0) throw new Error('Invalid prev_meal_id');
          if (!Number.isInteger(newMealId) || newMealId <= 0) throw new Error('Invalid new_meal_id');
          const prevMeal = await Meal.findOne({ where: { id: prevMealId, state: 0 }, transaction: t });
          const newMeal = await Meal.findOne({ where: { id: newMealId, state: 0 }, transaction: t });
          if (!prevMeal || !newMeal) throw new Error('Meal not found');
          const pmRow = await PlanMeal.findOne({ where: { plan_id: plan.id, meal_id: newMealId }, transaction: t });
          const proteinQty = pmRow ? Number(pmRow.protein_quantity) : null;
          const carbsQty = pmRow ? Number(pmRow.carbs_quantity) : null;
          let allowedCount = null;
          if (subType === 'custom') {
            if (c.allowed_meals_count !== undefined && c.allowed_meals_count !== null && c.allowed_meals_count !== '') {
              const ac = Number(c.allowed_meals_count);
              if (!Number.isInteger(ac) || ac <= 0) throw new Error('allowed_meals_count غير صالح');
              allowedCount = ac;
            } else {
              const pmPrev = await PlanMeal.findOne({ where: { plan_id: plan.id, meal_id: prevMealId }, transaction: t });
              allowedCount = pmPrev ? Number(pmPrev.allowed_meals_count || 0) : null;
            }
          }
          rows.push({
            subscription_id: subscription.id,
            plan_id: plan.id,
            prev_meal_id: prevMealId,
            new_meal_id: newMealId,
            protein_quantity: proteinQty,
            carbs_quantity: carbsQty,
            allowed_meals_count: allowedCount,
          });
        }
        await SubscriptionCustomization.bulkCreate(rows, { transaction: t });
      }
      // إضافات الاشتراك
      if (addons.length > 0) {
        const addonRows = [];
        for (const a of addons) {
          const categoryId = Number(a.category_id);
          const price = Number(a.price || 0);
          if (!Number.isInteger(categoryId) || categoryId <= 0) throw new Error('رقم الصنف غير صالح');
          const category = await Category.findOne({ where: { id: categoryId, status: 'active' }, transaction: t });
          if (!category) throw new Error('الصنف غير موجود أو محذوف');
          if (!Number.isFinite(price) || price < 0) throw new Error('سعر الإضافة غير صالح');
          addonRows.push({ subscription_id: subscription.id, category_id: categoryId, price });
        }
        await SubscriptionAddon.bulkCreate(addonRows, { transaction: t });
      }
      return { subscriber, subscription, plan: await buildEffectivePlanForSubscription(subscription.id, t) };
    }
  });
}

async function listSubscriptionsBySubscriber(subscriberId, { page = 1, limit = 10 }) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const { rows, count } = await Subscription.findAndCountAll({
    where: { subscriber_id: subscriberId },
    offset,
    limit: safeLimit,
    order: [['id', 'DESC']],
    include: [{ model: Plan, as: 'plan' }],
  });
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows, count, page: safePage, limit: safeLimit, totalPages };
}

async function listPausesBySubscription(subscriptionId, { page = 1, limit = 10 }) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const { rows, count } = await SubscriptionPause.findAndCountAll({
    where: { subscription_id: subscriptionId },
    offset,
    limit: safeLimit,
    order: [['id', 'DESC']],
  });
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows, count, page: safePage, limit: safeLimit, totalPages };
}

async function listAllSubscriptions({ q, branch_id, status = 'all', type = 'all', from, to, page = 1, limit = 10 }, requesterId) {
  const superAdmin = await isSuperAdminUser(requesterId);
  const whereSubscriber = {};
  if (q) {
    whereSubscriber[Op.or] = [
      { full_name: { [Op.iLike]: `%${q}%` } },
      { phone: { [Op.iLike]: `%${q}%` } },
    ];
  }
  const whereSub = {};
  if (status && status !== 'all') whereSub.status = status;
  if (type && type !== 'all') whereSub.type = type;
  if (from || to) {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (fromDate && toDate) {
      whereSub.start_date = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      whereSub.start_date = { [Op.gte]: fromDate };
    } else if (toDate) {
      whereSub.start_date = { [Op.lte]: toDate };
    }
  }
  if (!superAdmin) {
    const requesterBranchId = await getRequesterBranchId(requesterId);
    whereSub.branch_id = requesterBranchId;
  } else if (branch_id) {
    whereSub.branch_id = branch_id;
  }
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const includeSubscriber = { model: Subscriber, as: 'subscriber', required: !!q };
  if (q) includeSubscriber.where = whereSubscriber;
  const { rows, count } = await Subscription.findAndCountAll({
    where: whereSub,
    offset,
    limit: safeLimit,
    order: [['id', 'DESC']],
    include: [includeSubscriber, { model: Plan, as: 'plan' }],
  });
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dataRows = [];
  for (const sub of rows) {
    const isCurrent = sub.status !== 'ended' && sub.end_date && new Date(sub.end_date).getTime() >= todayStart.getTime();
    const remaining_days = sub.end_date ? calculateRemainingDays(sub.end_date) : null;
    const plan = await buildEffectivePlanForSubscription(sub.id);
    const addons = await SubscriptionAddon.findAll({ where: { subscription_id: sub.id }, include: [{ model: Category, as: 'category' }] });
    const subObj = sub.toJSON ? sub.toJSON() : sub;
    subObj.is_current = isCurrent;
    subObj.remaining_days = remaining_days;
    subObj.plan = plan;
    subObj.addons = addons;
    dataRows.push({ subscription: subObj });
  }
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows: dataRows, count, page: safePage, limit: safeLimit, totalPages };
}

async function listAllDeliveries({ q, branch_id, from, to, page = 1, limit = 10 }, requesterId) {
  const superAdmin = await isSuperAdminUser(requesterId);
  const whereDelivery = {};
  if (from || to) {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (fromDate && toDate) {
      whereDelivery.created_at = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      whereDelivery.created_at = { [Op.gte]: fromDate };
    } else if (toDate) {
      whereDelivery.created_at = { [Op.lte]: toDate };
    }
  }
  if (!superAdmin) {
    const requesterBranchId = await getRequesterBranchId(requesterId);
    whereDelivery.branch_id = requesterBranchId;
  } else if (branch_id) {
    whereDelivery.branch_id = branch_id;
  }
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const includeSubscription = {
    model: Subscription,
    as: 'subscription',
    include: [
      { model: Subscriber, as: 'subscriber', where: q ? { [Op.or]: [{ full_name: { [Op.iLike]: `%${q}%` } }, { phone: { [Op.iLike]: `%${q}%` } }] } : undefined, required: !!q },
      { model: Plan, as: 'plan' },
    ],
  };
  const { rows, count } = await SubscriptionDelivery.findAndCountAll({
    where: whereDelivery,
    offset,
    limit: safeLimit,
    order: [['id', 'DESC']],
    include: [
      includeSubscription,
      { model: Branch, as: 'branch' },
      { model: SubscriptionDeliveryDetail, as: 'details', include: [{ model: Meal, as: 'meal' }] },
    ],
  });
  const dataRows = rows.map((d) => ({ delivery: d }));
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows: dataRows, count, page: safePage, limit: safeLimit, totalPages };
}

async function listDeliveriesBySubscription(subscriptionId, { page = 1, limit = 10 }) {
  const subscription = await Subscription.findByPk(subscriptionId, { include: [{ model: Subscriber, as: 'subscriber' }, { model: Plan, as: 'plan' }] });
  if (!subscription) throw new Error('الاشتراك غير موجود');
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isCurrent = subscription.status !== 'ended' && subscription.end_date && new Date(subscription.end_date).getTime() >= todayStart.getTime();
  const remaining_days = subscription.end_date ? calculateRemainingDays(subscription.end_date) : null;
  const effectivePlan = await buildEffectivePlanForSubscription(subscriptionId);
  const { rows, count } = await SubscriptionDelivery.findAndCountAll({
    where: { subscription_id: subscriptionId },
    offset,
    limit: safeLimit,
    order: [['id', 'DESC']],
    include: [
      { model: Subscription, as: 'subscription', include: [{ model: Subscriber, as: 'subscriber' }, { model: Plan, as: 'plan' }] },
      { model: Branch, as: 'branch' },
      { model: SubscriptionDeliveryDetail, as: 'details', include: [{ model: Meal, as: 'meal' }] },
    ],
  });
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  const dataRows = rows.map((d) => {
    const sub = d.subscription ? (d.subscription.toJSON ? d.subscription.toJSON() : d.subscription) : null;
    if (sub) {
      sub.is_current = isCurrent;
      sub.remaining_days = remaining_days;
      sub.plan = effectivePlan;
      d.subscription = sub;
    }
    return { delivery: d };
  });
  return { rows: dataRows, count, page: safePage, limit: safeLimit, totalPages };
}

async function listTodayKitchenPreparation({ page = 1, limit = 10 }) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const dayEn = daysEn[today.getDay()];
  const workday = await Workday.findOne({ where: { status: 'active', name_en: { [Op.iLike]: dayEn } } });
  if (!workday) return { rows: [], count: 0, page: safePage, limit: safeLimit, totalPages: 1 };
  const subs = await Subscription.findAll({
    where: { status: 'ongoing', type: { [Op.in]: ['pickup', 'delivery'] } },
    include: [{ model: Plan, as: 'plan' }],
  });
  if (subs.length === 0) return { rows: [], count: 0, page: safePage, limit: safeLimit, totalPages: 1 };
  const planIds = Array.from(new Set(subs.map((s) => s.plan_id)));
  const planMeals = await PlanMeal.findAll({ where: { plan_id: { [Op.in]: planIds }, workday_id: workday.id } });
  const mapMealsByPlan = new Map();
  for (const pm of planMeals) {
    const p = pm.toJSON ? pm.toJSON() : pm;
    const arr = mapMealsByPlan.get(p.plan_id) || [];
    arr.push(p.meal_id);
    mapMealsByPlan.set(p.plan_id, arr);
  }
  const subIds = subs.map((s) => s.id);
  const customs = await SubscriptionCustomization.findAll({ where: { subscription_id: { [Op.in]: subIds } } });
  const customMap = new Map();
  customs.forEach((c) => {
    const x = c.toJSON ? c.toJSON() : c;
    customMap.set(`${x.subscription_id}:${x.prev_meal_id}`, x.new_meal_id);
  });
  const agg = new Map();
  for (const s of subs) {
    const mealIds = mapMealsByPlan.get(s.plan_id) || [];
    for (const mid of mealIds) {
      const effMid = customMap.get(`${s.id}:${mid}`) || mid;
      const key = `${s.plan_id}:${effMid}`;
      const val = agg.get(key);
      if (val) agg.set(key, { ...val, count: val.count + 1 });
      else agg.set(key, { plan_id: s.plan_id, meal_id: effMid, count: 1 });
    }
  }
  const rowsAgg = Array.from(agg.values());
  const mealIdsAll = Array.from(new Set(rowsAgg.map((r) => r.meal_id)));
  const planLookup = await Plan.findAll({ where: { id: { [Op.in]: planIds } } });
  const mealLookup = await Meal.findAll({ where: { id: { [Op.in]: mealIdsAll } } });
  const planMap = new Map();
  const mealMap = new Map();
  planLookup.forEach((p) => {
    const j = p.toJSON ? p.toJSON() : p;
    planMap.set(j.id, { name: j.name, total_meals_count: Number(j.total_meals_count) || 0 });
  });
  mealLookup.forEach((m) => {
    const j = m.toJSON ? m.toJSON() : m;
    mealMap.set(j.id, { name: j.name, image: j.image });
  });
  const subsPlanMap = new Map();
  subs.forEach((s) => subsPlanMap.set(s.id, s.plan_id));
  const addonsAll = await SubscriptionAddon.findAll({
    where: { subscription_id: { [Op.in]: subIds } },
    include: [{ model: Category, as: 'category' }],
  });
  const addonsByPlan = new Map();
  for (const a of addonsAll) {
    const aj = a.toJSON ? a.toJSON() : a;
    const planId = subsPlanMap.get(aj.subscription_id);
    if (!planId) continue;
    const cat = aj.category || {};
    const catId = cat.id || aj.category_id;
    const catName = cat.name || null;
    const catType = cat.type || null;
    const planCats = addonsByPlan.get(planId) || new Map();
    const prev = planCats.get(catId) || { id: catId, name: catName, type: catType, count: 0 };
    planCats.set(catId, { ...prev, count: prev.count + 1 });
    addonsByPlan.set(planId, planCats);
  }
  const byPlan = new Map();
  for (const r of rowsAgg) {
    const entry = byPlan.get(r.plan_id) || { plan_id: r.plan_id, meals: [], total: 0 };
    entry.meals.push({ meal_id: r.meal_id, count: r.count });
    entry.total += r.count;
    byPlan.set(r.plan_id, entry);
  }
  // merge addons into byPlan, ensure plans with only addons are present
  for (const [pid, catsMap] of addonsByPlan.entries()) {
    const entry = byPlan.get(pid) || { plan_id: pid, meals: [], total: 0 };
    entry.addons = Array.from(catsMap.values()).map((c) => ({
      category: { id: c.id, name: c.name, type: c.type },
      count: c.count,
    }));
    byPlan.set(pid, entry);
  }
  const plansArray = Array.from(byPlan.values());
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit;
  const sliced = plansArray.slice(start, end).map((p) => {
    const info = planMap.get(p.plan_id) || { name: null, total_meals_count: 0 };
    return {
      workday: { id: workday.id, name_en: workday.name_en, name_ar: workday.name_ar, status: workday.status },
      plan: { id: p.plan_id, name: info.name, total_meals_count: info.total_meals_count },
      meals: p.meals.map((m) => ({
        meal: { id: m.meal_id, name: (mealMap.get(m.meal_id) || {}).name || null, image: (mealMap.get(m.meal_id) || {}).image || null },
        count: m.count,
      })),
      addons: Array.isArray(p.addons) ? p.addons : [],
    };
  });
  const totalPages = Math.max(1, Math.ceil(plansArray.length / safeLimit));
  return { rows: sliced, count: plansArray.length, page: safePage, limit: safeLimit, totalPages };
}

async function listTomorrowKitchenPreparation({ page = 1, limit = 10 }) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const nextIdx = (today.getDay() + 1) % 7;
  const dayEn = daysEn[nextIdx];
  const workday = await Workday.findOne({ where: { status: 'active', name_en: { [Op.iLike]: dayEn } } });
  if (!workday) return { rows: [], count: 0, page: safePage, limit: safeLimit, totalPages: 1 };
  const subs = await Subscription.findAll({
    where: { status: 'ongoing', type: { [Op.in]: ['pickup', 'delivery'] } },
    include: [{ model: Plan, as: 'plan' }],
  });
  if (subs.length === 0) return { rows: [], count: 0, page: safePage, limit: safeLimit, totalPages: 1 };
  const planIds = Array.from(new Set(subs.map((s) => s.plan_id)));
  const planMeals = await PlanMeal.findAll({ where: { plan_id: { [Op.in]: planIds }, workday_id: workday.id } });
  const mapMealsByPlan = new Map();
  for (const pm of planMeals) {
    const p = pm.toJSON ? pm.toJSON() : pm;
    const arr = mapMealsByPlan.get(p.plan_id) || [];
    arr.push(p.meal_id);
    mapMealsByPlan.set(p.plan_id, arr);
  }
  const subIds = subs.map((s) => s.id);
  const customs = await SubscriptionCustomization.findAll({ where: { subscription_id: { [Op.in]: subIds } } });
  const customMap = new Map();
  customs.forEach((c) => {
    const x = c.toJSON ? c.toJSON() : c;
    customMap.set(`${x.subscription_id}:${x.prev_meal_id}`, x.new_meal_id);
  });
  const agg = new Map();
  for (const s of subs) {
    const mealIds = mapMealsByPlan.get(s.plan_id) || [];
    for (const mid of mealIds) {
      const effMid = customMap.get(`${s.id}:${mid}`) || mid;
      const key = `${s.plan_id}:${effMid}`;
      const val = agg.get(key);
      if (val) agg.set(key, { ...val, count: val.count + 1 });
      else agg.set(key, { plan_id: s.plan_id, meal_id: effMid, count: 1 });
    }
  }
  const rowsAgg = Array.from(agg.values());
  const mealIdsAll = Array.from(new Set(rowsAgg.map((r) => r.meal_id)));
  const planLookup = await Plan.findAll({ where: { id: { [Op.in]: planIds } } });
  const mealLookup = await Meal.findAll({ where: { id: { [Op.in]: mealIdsAll } } });
  const planMap = new Map();
  const mealMap = new Map();
  planLookup.forEach((p) => {
    const j = p.toJSON ? p.toJSON() : p;
    planMap.set(j.id, { name: j.name, total_meals_count: Number(j.total_meals_count) || 0 });
  });
  mealLookup.forEach((m) => {
    const j = m.toJSON ? m.toJSON() : m;
    mealMap.set(j.id, { name: j.name, image: j.image });
  });
  const subsPlanMap = new Map();
  subs.forEach((s) => subsPlanMap.set(s.id, s.plan_id));
  const addonsAll = await SubscriptionAddon.findAll({
    where: { subscription_id: { [Op.in]: subIds } },
    include: [{ model: Category, as: 'category' }],
  });
  const addonsByPlan = new Map();
  for (const a of addonsAll) {
    const aj = a.toJSON ? a.toJSON() : a;
    const planId = subsPlanMap.get(aj.subscription_id);
    if (!planId) continue;
    const cat = aj.category || {};
    const catId = cat.id || aj.category_id;
    const catName = cat.name || null;
    const catType = cat.type || null;
    const planCats = addonsByPlan.get(planId) || new Map();
    const prev = planCats.get(catId) || { id: catId, name: catName, type: catType, count: 0 };
    planCats.set(catId, { ...prev, count: prev.count + 1 });
    addonsByPlan.set(planId, planCats);
  }
  const byPlan = new Map();
  for (const r of rowsAgg) {
    const entry = byPlan.get(r.plan_id) || { plan_id: r.plan_id, meals: [], total: 0 };
    entry.meals.push({ meal_id: r.meal_id, count: r.count });
    entry.total += r.count;
    byPlan.set(r.plan_id, entry);
  }
  for (const [pid, catsMap] of addonsByPlan.entries()) {
    const entry = byPlan.get(pid) || { plan_id: pid, meals: [], total: 0 };
    entry.addons = Array.from(catsMap.values()).map((c) => ({
      category: { id: c.id, name: c.name, type: c.type },
      count: c.count,
    }));
    byPlan.set(pid, entry);
  }
  const plansArray = Array.from(byPlan.values());
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit;
  const sliced = plansArray.slice(start, end).map((p) => {
    const info = planMap.get(p.plan_id) || { name: null, total_meals_count: 0 };
    return {
      workday: { id: workday.id, name_en: workday.name_en, name_ar: workday.name_ar, status: workday.status },
      plan: { id: p.plan_id, name: info.name, total_meals_count: info.total_meals_count },
      meals: p.meals.map((m) => ({
        meal: { id: m.meal_id, name: (mealMap.get(m.meal_id) || {}).name || null, image: (mealMap.get(m.meal_id) || {}).image || null },
        count: m.count,
      })),
      addons: Array.isArray(p.addons) ? p.addons : [],
    };
  });
  const totalPages = Math.max(1, Math.ceil(plansArray.length / safeLimit));
  return { rows: sliced, count: plansArray.length, page: safePage, limit: safeLimit, totalPages };
}
async function getSubscriptionSettings() {
  const existing = await SubscriptionSetting.findOne();
  if (existing) return existing;
  const created = await SubscriptionSetting.create({ max_daily_meal_withdrawal: 3 });
  return created;
}

async function updateSubscriptionSettings(maxDaily) {
  const n = Number(maxDaily);
  if (!Number.isInteger(n) || n <= 0) throw new Error('Invalid max_daily_meal_withdrawal');
  const existing = await SubscriptionSetting.findOne();
  if (existing) {
    await existing.update({ max_daily_meal_withdrawal: n });
    return existing;
  }
  const created = await SubscriptionSetting.create({ max_daily_meal_withdrawal: n });
  return created;
}

module.exports = {
  createSubscriberWithSubscription,
  updateSubscriberAndSubscription,
  listSubscribersWithCurrentSubscription,
  getPreviewBySubscriberId,
  getPreviewBySubscriptionId,
  pauseSubscription,
  resumeSubscription,
  listSubscriptionsBySubscriber,
  listPausesBySubscription,
  renewSubscription,
  documentSubscriptionDeliveries,
  listAllSubscriptions,
  listAllDeliveries,
  listDeliveriesBySubscription,
  getSubscriptionSettings,
  updateSubscriptionSettings,
  buildEffectivePlanForSubscription,
  normalPauseSubscription,
  updateSubscriptionDeliveryBranch,
  listTodayKitchenPreparation,
  listTomorrowKitchenPreparation
};
