const { generalResponse, errorResponse } = require('../../utils/response.util');
const { updateFieldsFilter, buildFileUrl } = require('../../utils/helpers.util');
const {
  createMeal,
  updateMeal,
  softDeleteMeal,
  getMeals,
  getMealById,
} = require('../../services/admin/meal.service');

async function create(req, res) {
  try {
    const required = updateFieldsFilter(req.body, ['name'], true);
    const optional = updateFieldsFilter(req.body, ['meal_type', 'garnish_category_id', 'description', 'image'], false);
    const base = { ...required, ...optional };
    const uploaded = req.file || (req.files && (req.files.photo?.[0] || req.files.file?.[0]));
    const photoPath = uploaded ? `uploads/meals/${uploaded.filename}` : null;
    const meal = await createMeal(base, req.user.user_id, photoPath);
    const json = meal.toJSON ? meal.toJSON() : meal;
    json.image = buildFileUrl(req, json.image);
    return generalResponse(res, { meal: json }, 'تم إنشاء الوجبة بنجاح', true, true, 201);
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const payload = updateFieldsFilter(req.body, ['name', 'meal_type', 'garnish_category_id', 'description', 'image'], false);
    const uploaded = req.file || (req.files && (req.files.photo?.[0] || req.files.file?.[0]));
    const photoPath = uploaded ? `uploads/meals/${uploaded.filename}` : undefined;
    const meal = await updateMeal(id, payload, photoPath);
    const json = meal.toJSON ? meal.toJSON() : meal;
    json.image = buildFileUrl(req, json.image);
    return generalResponse(res, { meal: json }, 'تم تحديث الوجبة بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function remove(req, res) {
  try {
    const id = req.params.id;
    const meal = await softDeleteMeal(id);
    const data = meal.toJSON ? meal.toJSON() : meal;
    data.image = buildFileUrl(req, data.image);
    return generalResponse(res, data, 'Meal deleted');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function list(req, res) {
  try {
    const q = req.query.q || '';
    const type = req.query.type || undefined;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await getMeals({ q, type, page, limit });
    const rows = Array.isArray(result.rows)
      ? result.rows.map((item) => {
          const json = item.meal.toJSON ? item.meal.toJSON() : item.meal;
          if (json.image) json.image = buildFileUrl(req, json.image);
          return { meal: json };
        })
      : [];
    const data = { ...result, rows };
    return generalResponse(res, data, 'تم جلب الوجبات بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function findById(req, res) {
  try {
    const id = req.params.id;
    const meal = await getMealById(id);
    const json = meal.meal.toJSON ? meal.meal.toJSON() : meal.meal;
    if (json.image) json.image = buildFileUrl(req, json.image);
    return generalResponse(res, { meal: json }, 'تم جلب بيانات الوجبة بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 404);
  }
}

module.exports = {
  create,
  update,
  remove,
  list,
  findById,
};
