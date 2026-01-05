const { generalResponse, errorResponse } = require('../../utils/response.util');
const { updateFieldsFilter, buildFileUrl, normalizeArrayInput } = require('../../utils/helpers.util');
const {
  createPlanWithMeals,
  softDeletePlan,
  activatePlan,
  deactivatePlan,
  getPlans,
  getPlanById,
} = require('../../services/admin/plan.service');

function groupPlanMealsByDay(data, req) {
  if (!data || data.type !== 'normal' || !Array.isArray(data.plan_meals)) return data;
  const map = new Map();
  for (const pm of data.plan_meals) {
    const day = pm.workday;
    if (!day) continue;
    const key = day.id;
    const meal = pm.meal || null;
    if (meal && meal.image) meal.image = buildFileUrl(req, meal.image);
    const entry = map.get(key) || { workday: day, meals: [] };
    entry.meals.push({
      meal,
      protein_quantity: pm.protein_quantity,
      carbs_quantity: pm.carbs_quantity,
      allowed_meals_count: pm.allowed_meals_count || null,
      description: pm.description || null,
    });
    map.set(key, entry);
  }
  data.plan_days = Array.from(map.values());
  delete data.plan_meals;
  return data;
}

async function create(req, res) {
  try {
    const required = updateFieldsFilter(req.body, ['name', 'price', 'duration_days', 'protein_quantity', 'carbs_quantity', 'total_meals_count'], true);
    const optional = updateFieldsFilter(req.body, ['description', 'type', 'status', 'image', 'meals', 'meal_types', 'breakfasts_count', 'lunches_count', 'dinners_count'], false);
    const base = { ...required, ...optional };
    base.meals = normalizeArrayInput(base.meals);
    base.meal_types = normalizeArrayInput(base.meal_types);
    const uploaded = req.file || (req.files && (req.files.photo?.[0] || req.files.file?.[0]));
    const photoPath = uploaded ? `uploads/plans/${uploaded.filename}` : null;
    const plan = await createPlanWithMeals(base, req.user.user_id, photoPath);
    const data = plan.toJSON ? plan.toJSON() : plan;
    data.image = buildFileUrl(req, data.image);
    if (Array.isArray(data.plan_meals)) {
      data.plan_meals = data.plan_meals.map((pm) => {
        const json = pm;
        if (json.meal && json.meal.image) {
          json.meal.image = buildFileUrl(req, json.meal.image);
        }
        return json;
      });
    }
    groupPlanMealsByDay(data, req);
    return generalResponse(res, data, 'تم إنشاء الباقة بنجاح', true, true, 201);
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function remove(req, res) {
  try {
    const id = req.params.id;
    const plan = await softDeletePlan(id);
    const data = plan.toJSON ? plan.toJSON() : plan;
    data.image = buildFileUrl(req, data.image);
    return generalResponse(res, data, 'Plan deleted');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function list(req, res) {
  try {
    const q = req.query.q || '';
    const status = req.query.status || 'all';
    const type = req.query.type || 'all';
    const price_min = req.query.price_min;
    const price_max = req.query.price_max;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await getPlans({ q, status, type, price_min, price_max, page, limit });
    const rows = Array.isArray(result.rows) ? result.rows.map((p) => {
      const json = p.toJSON ? p.toJSON() : p;
      json.image = buildFileUrl(req, json.image);
      if (Array.isArray(json.plan_meals)) {
        json.plan_meals = json.plan_meals.map((pm) => {
          const x = pm;
          if (x.meal && x.meal.image) {
            x.meal.image = buildFileUrl(req, x.meal.image);
          }
          return x;
        });
      }
      groupPlanMealsByDay(json, req);
      return json;
    }) : [];
    const data = { ...result, rows };
    return generalResponse(res, data, 'تم جلب الباقات بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function findById(req, res) {
  try {
    const id = req.params.id;
    const plan = await getPlanById(id);
    const data = plan.toJSON ? plan.toJSON() : plan;
    data.image = buildFileUrl(req, data.image);
    if (Array.isArray(data.plan_meals)) {
      data.plan_meals = data.plan_meals.map((pm) => {
        const json = pm;
        if (json.meal && json.meal.image) {
          json.meal.image = buildFileUrl(req, json.meal.image);
        }
        return json;
      });
    }
    groupPlanMealsByDay(data, req);
    return generalResponse(res, data, 'تم جلب بيانات الباقة بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 404);
  }
}

async function activate(req, res) {
  try {
    const id = req.params.id;
    const plan = await activatePlan(id);
    const data = plan.toJSON ? plan.toJSON() : plan;
    data.image = buildFileUrl(req, data.image);
    return generalResponse(res, data, 'تم تفعيل الباقة');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function deactivate(req, res) {
  try {
    const id = req.params.id;
    const plan = await deactivatePlan(id);
    const data = plan.toJSON ? plan.toJSON() : plan;
    data.image = buildFileUrl(req, data.image);
    return generalResponse(res, data, 'تم إيقاف الباقة');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

module.exports = {
  create,
  remove,
  list,
  findById,
  activate,
  deactivate,
};
