'use strict';
const { Category } = require('../../../models');
const { Op } = require('sequelize');

async function createCategory(payload) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const type = typeof payload.type === 'string' ? payload.type : 'snack_full';
  if (!name) throw new Error('اسم الصنف مطلوب');
  if (!['snack_full', 'snack', 'salads', 'garnish'].includes(type)) throw new Error('نوع الصنف غير صالح');
  const existing = await Category.findOne({ where: { name, status: 'active' } });
  if (existing) throw new Error('الصنف موجود مسبقًا');
  const category = await Category.create({ name, type, status: 'active' });
  return category;
}

async function updateCategory(id, payload) {
  const category = await Category.findByPk(id);
  if (!category || category.status === 'delete') throw new Error('الصنف غير موجود');
  const updates = {};
  if (payload.name !== undefined) {
    const name = String(payload.name || '').trim();
    if (!name) throw new Error('اسم الصنف غير صالح');
    updates.name = name;
  }
  if (payload.type !== undefined) {
    const type = String(payload.type);
    if (!['snack_full', 'snack', 'salads', 'garnish'].includes(type)) throw new Error('نوع الصنف غير صالح');
    updates.type = type;
  }
  if (payload.status !== undefined) {
    const status = String(payload.status);
    if (!['active', 'delete'].includes(status)) throw new Error('حالة الصنف غير صالحة');
    updates.status = status;
  }
  await category.update(updates);
  return category;
}

async function softDeleteCategory(id) {
  const category = await Category.findByPk(id);
  if (!category) throw new Error('الصنف غير موجود');
  if (category.status === 'delete') return category;
  await category.update({ status: 'delete' });
  return category;
}

async function findCategoryById(id) {
  const category = await Category.findByPk(id);
  if (!category || category.status === 'delete') throw new Error('الصنف غير موجود');
  return category;
}

async function listCategories({ q, type, status = 'active', page = 1, limit = 10 }) {
  const where = {};
  if (q) where.name = { [Op.iLike]: `%${q}%` };
  if (type && ['snack_full', 'snack', 'salads', 'garnish'].includes(type)) where.type = type;
  if (status && status !== 'all') where.status = status;
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const { rows, count } = await Category.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [['id', 'DESC']],
  });
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows, count, page: safePage, limit: safeLimit, totalPages };
}

async function listSnackTypesCategories({ q, status = 'active', page = 1, limit = 10 }) {
  const where = {
    type: { [Op.in]: ['snack_full', 'snack', 'salads'] },
  };
  if (q) where.name = { [Op.iLike]: `%${q}%` };
  if (status && status !== 'all') where.status = status;
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const { rows, count } = await Category.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [['id', 'DESC']],
  });
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows, count, page: safePage, limit: safeLimit, totalPages };
}

module.exports = {
  createCategory,
  updateCategory,
  softDeleteCategory,
  findCategoryById,
  listCategories,
  listSnackTypesCategories,
};
