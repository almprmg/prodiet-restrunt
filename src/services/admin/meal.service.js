const { Meal, Category, User, Branch } = require('../../../models');
const { Op } = require('sequelize');

async function createMeal(payload, createdBy, photoPath) {
  const image = photoPath || payload.image;
  if (!image) throw new Error('صورة الوجبة مطلوبة');
  const mealType = payload.meal_type || 'lunch';
  if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) throw new Error('نوع الوجبة غير صالح');
  let garnishId = payload.garnish_category_id === null ? null : Number(payload.garnish_category_id);
  if (payload.garnish_category_id !== undefined) {
    if (garnishId !== null && (!Number.isInteger(garnishId) || garnishId <= 0)) throw new Error('رقم التزيين غير صالح');
    if (garnishId !== null) {
      const cat = await Category.findByPk(garnishId);
      if (!cat || cat.status !== 'active' || cat.type !== 'garnish') throw new Error('تصنيف التزيين غير صالح أو غير نشط');
    }
  }
  const meal = await Meal.create({
    name: payload.name,
    image,
    description: payload.description,
    meal_type: mealType,
    garnish_category_id: garnishId || null,
    state: 0,
    created_by: createdBy,
  });
  return meal;
}

async function updateMeal(id, payload, photoPath) {
  const meal = await Meal.findByPk(id);
  if (!meal || meal.state === 1) throw new Error('الوجبة غير موجودة');
  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.meal_type !== undefined) {
    const mealType = String(payload.meal_type);
    if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) throw new Error('نوع الوجبة غير صالح');
    updates.meal_type = mealType;
  }
  if (payload.garnish_category_id !== undefined) {
    if (payload.garnish_category_id === null || payload.garnish_category_id === '') {
      updates.garnish_category_id = null;
    } else {
      const garnishId = Number(payload.garnish_category_id);
      if (!Number.isInteger(garnishId) || garnishId <= 0) throw new Error('رقم التزيين غير صالح');
      const cat = await Category.findByPk(garnishId);
      if (!cat || cat.status !== 'active' || cat.type !== 'garnish') throw new Error('تصنيف التزيين غير صالح أو غير نشط');
      updates.garnish_category_id = garnishId;
    }
  }
  const image = photoPath || payload.image;
  if (image !== undefined) updates.image = image;
  await meal.update(updates);
  return meal;
}

async function softDeleteMeal(id) {
  const meal = await Meal.findByPk(id);
  if (!meal || meal.state === 1) throw new Error('الوجبة غير موجودة');
  await meal.update({ state: 1 });
  return meal;
}

async function getMeals({ q, type, page = 1, limit = 10 }) {
  const where = { state: 0 };
  if (q) where.name = { [Op.iLike]: `%${q}%` };
  if (type && ['breakfast', 'lunch', 'dinner'].includes(type)) where.meal_type = type;
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const { rows, count } = await Meal.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [['id', 'ASC']],
    include: [
      { model: Category, as: 'garnish_category' },
      { model: User, as: 'creator', include: [{ model: Branch, as: 'branch' }] },
    ],
  });
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  const dataRows = rows.map((m) => ({
    meal: m,
  }));
  return { rows: dataRows, count, page: safePage, limit: safeLimit, totalPages };
}

async function getMealById(id) {
  const meal = await Meal.findOne({
    where: { id, state: 0 },
    include: [
      { model: Category, as: 'garnish_category' },
      { model: User, as: 'creator', include: [{ model: Branch, as: 'branch' }] },
    ],
  });
  if (!meal) throw new Error('الوجبة غير موجودة');
  return { meal };
}

module.exports = {
  createMeal,
  updateMeal,
  softDeleteMeal,
  getMeals,
  getMealById,
};
