const { Plan, PlanMeal, Meal, Workday, sequelize } = require('../../../models');
const { Op } = require('sequelize');
const { normalizeArrayInput } = require('../../utils/helpers.util');

async function createPlanWithMeals(payload, createdBy, imagePath) {
  return await sequelize.transaction(async (t) => {
    const image = imagePath || payload.image;
    if (!image) throw new Error('صورة الباقة مطلوبة');
    if (payload.name === undefined) throw new Error('حقل name مطلوب');
    if (payload.price === undefined) throw new Error('حقل price مطلوب');
    if (payload.duration_days === undefined) throw new Error('حقل duration_days مطلوب');
    const type = payload.type || 'normal';
    if (!['normal', 'custom'].includes(type)) throw new Error('نوع الباقة غير صالح');
    const status = payload.status || 'active';
    if (!['active', 'inactive', 'deleted'].includes(status)) throw new Error('حالة الباقة غير صالحة');
    const priceNum = Number(payload.price);
    const durationNum = Number(payload.duration_days);
    if (!Number.isFinite(priceNum) || priceNum <= 0) throw new Error('سعر غير صالح');
    if (!Number.isInteger(durationNum) || durationNum <= 0) throw new Error('مدة أيام غير صالحة');
    const proteinPlan = Number(payload.protein_quantity);
    const carbsPlan = Number(payload.carbs_quantity);
    const totalMeals = Number(payload.total_meals_count);
    if (!Number.isFinite(proteinPlan) || proteinPlan < 0) throw new Error('كمية بروتين الباقة غير صالحة');
    if (!Number.isFinite(carbsPlan) || carbsPlan < 0) throw new Error('كمية الكربوهيدرات في الباقة غير صالحة');
    if (!Number.isInteger(totalMeals) || totalMeals <= 0) throw new Error('عدد الوجبات في الباقة غير صالح');
    const mealTypes = normalizeArrayInput(payload.meal_types);
    if (mealTypes.length === 0) throw new Error('مصفوفة أنواع الوجبات مطلوبة');
    const countsByType = { breakfast: 0, lunch: 0, dinner: 0 };
    for (const mt of mealTypes) {
      const tkey = String(mt.type || '').toLowerCase();
      const cnt = Number(mt.count);
      if (!['breakfast', 'lunch', 'dinner'].includes(tkey)) throw new Error('نوع وجبة غير صالح في أنواع الوجبات');
      if (!Number.isInteger(cnt) || cnt < 0) throw new Error('عدد نوع الوجبات غير صالح');
      countsByType[tkey] += cnt;
    }
    const sumTypes = countsByType.breakfast + countsByType.lunch + countsByType.dinner;
    if (sumTypes !== totalMeals) throw new Error('مجموع أنواع الوجبات لا يساوي إجمالي عدد وجبات الباقة');
    const meals = normalizeArrayInput(payload.meals);
    if (meals.length === 0) throw new Error('مصفوفة الوجبات مطلوبة');

    const plan = await Plan.create(
      {
        name: payload.name,
        image,
        price: priceNum,
        duration_days: durationNum,
        description: payload.description || null,
        type,
        status,
        protein_quantity: proteinPlan,
        carbs_quantity: carbsPlan,
        total_meals_count: totalMeals,
        breakfasts_count: countsByType.breakfast || null,
        lunches_count: countsByType.lunch || null,
        dinners_count: countsByType.dinner || null,
        created_by: createdBy,
      },
      { transaction: t }
    );

    const rows = [];
    for (const m of meals) {
      const mealId = Number(m.meal_id);
      const proteinQty = proteinPlan;
      const carbsQty = carbsPlan;
      const allowedCount = m.allowed_meals_count !== undefined && m.allowed_meals_count !== null ? Number(m.allowed_meals_count) : null;
      const workdayId = m.workday_id !== undefined ? Number(m.workday_id) : undefined;
      if (!Number.isInteger(mealId) || mealId <= 0) throw new Error('meal_id غير صالح');
      if (type === 'normal') {
        if (workdayId === undefined) throw new Error('workday_id مطلوب لنوع الباقة العادي');
        if (!Number.isInteger(workdayId) || workdayId <= 0) throw new Error('workday_id غير صالح');
      }
      const meal = await Meal.findOne({ where: { id: mealId, state: 0 }, transaction: t });
      if (!meal) throw new Error(`الوجبة غير موجودة: ${mealId}`);
      if (workdayId !== undefined) {
        const day = await Workday.findOne({ where: { id: workdayId, status: 'active' }, transaction: t });
        if (!day) throw new Error(`يوم العمل غير موجود أو غير نشط: ${workdayId}`);
      }
      if (type === 'custom') {
        if (allowedCount === null || !Number.isInteger(allowedCount) || allowedCount <= 0) {
          throw new Error('عدد الوجبات المسموح بها مطلوب وموجب لنوع الباقة المخصص');
        }
      }
      rows.push({
        plan_id: plan.id,
        workday_id: workdayId || null,
        meal_id: mealId,
        protein_quantity: proteinQty,
        carbs_quantity: carbsQty,
        allowed_meals_count: allowedCount,
        description: m.description || null,
      });
    }
    await PlanMeal.bulkCreate(rows, { transaction: t });

    const withDetails = await Plan.findByPk(plan.id, {
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
      transaction: t,
    });
    return withDetails;
  });
}

async function softDeletePlan(id) {
  const plan = await Plan.findByPk(id);
  if (!plan || plan.status === 'deleted') throw new Error('Plan not found');
  await plan.update({ status: 'deleted' });
  return plan;
}

async function activatePlan(id) {
  const plan = await Plan.findByPk(id);
  if (!plan || plan.status === 'deleted') throw new Error('Plan not found or deleted');
  await plan.update({ status: 'active' });
  return plan;
}

async function deactivatePlan(id) {
  const plan = await Plan.findByPk(id);
  if (!plan || plan.status === 'deleted') throw new Error('Plan not found or deleted');
  await plan.update({ status: 'inactive' });
  return plan;
}

async function getPlans({ q, status = 'all', type = 'all', price_min, price_max, page = 1, limit = 10 }) {
  const where = {};
  if (status === 'active' || status === 'inactive') where.status = status;
  else where.status = { [Op.in]: ['active', 'inactive'] };
  if (q) where.name = { [Op.iLike]: `%${q}%` };
  if (type === 'normal' || type === 'custom') where.type = type;
  const priceFilters = [];
  const minNum = price_min !== undefined ? Number(price_min) : undefined;
  const maxNum = price_max !== undefined ? Number(price_max) : undefined;
  if (minNum !== undefined && Number.isFinite(minNum)) priceFilters.push({ price: { [Op.gte]: minNum } });
  if (maxNum !== undefined && Number.isFinite(maxNum)) priceFilters.push({ price: { [Op.lte]: maxNum } });
  const andWhere = priceFilters.length ? { [Op.and]: priceFilters } : {};
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;

  const { rows, count } = await Plan.findAndCountAll({
    distinct: true,
    where: { ...where, ...andWhere },
    offset,
    limit: safeLimit,
    order: [['id', 'ASC']],
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
  });
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows, count, page: safePage, limit: safeLimit, totalPages };
}

async function getPlanById(id) {
  const plan = await Plan.findOne({
    where: { id, status: { [Op.in]: ['active', 'inactive'] } },
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
  });
  if (!plan) throw new Error('Plan not found');
  return plan;
}

module.exports = {
  createPlanWithMeals,
  softDeletePlan,
  activatePlan,
  deactivatePlan,
  getPlans,
  getPlanById,
};
