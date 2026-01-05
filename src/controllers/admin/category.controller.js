'use strict';
const { generalResponse, errorResponse } = require('../../utils/response.util');
const { createCategory, updateCategory, softDeleteCategory, findCategoryById, listCategories, listSnackTypesCategories } = require('../../services/admin/category.service');

async function create(req, res) {
  try {
    const category = await createCategory(req.body || {});
    return generalResponse(res, category, 'تم إنشاء الصنف بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) return errorResponse(res, 'رقم الصنف غير صالح', 400);
    const category = await updateCategory(id, req.body || {});
    return generalResponse(res, category, 'تم تحديث الصنف بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function remove(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) return errorResponse(res, 'رقم الصنف غير صالح', 400);
    const category = await softDeleteCategory(id);
    return generalResponse(res, category, 'تم حذف الصنف بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function list(req, res) {
  try {
    const { q, type, status = 'active', page = 1, limit = 10 } = req.query;
    const data = await listCategories({ q, type, status, page: parseInt(page, 10), limit: parseInt(limit, 10) });
    return generalResponse(res, data, 'تم جلب الأصناف بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function listSnacks(req, res) {
  try {
    const { q, status = 'active', page = 1, limit = 10 } = req.query;
    const data = await listSnackTypesCategories({ q, status, page: parseInt(page, 10), limit: parseInt(limit, 10) });
    return generalResponse(res, data, 'تم جلب أصناف السناك والسلطات بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}
async function findById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) return errorResponse(res, 'رقم الصنف غير صالح', 400);
    const category = await findCategoryById(id);
    return generalResponse(res, category, 'تم جلب بيانات الصنف بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

module.exports = {
  create,
  update,
  remove,
  list,
  findById,
  listSnacks,
};
