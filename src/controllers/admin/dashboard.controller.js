const { generalResponse, errorResponse } = require('../../utils/response.util');
const { updateFieldsFilter, validatePhone05, buildFileUrl } = require('../../utils/helpers.util');
const { getDashboardStats, getLatestSubscribers, getNearExpirySubscribers, getSubscriptionByPhone } = require('../../services/admin/dashboard.service');

async function stats(req, res) {
  try {
    const userId = req.user.user_id;
    const roleId = req.user.role_id;
    const data = await getDashboardStats(userId, roleId);
    return generalResponse(res, data, 'Dashboard stats fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function latestSubscribers(req, res) {
  try {
    const userId = req.user.user_id;
    const roleId = req.user.role_id;
    const data = await getLatestSubscribers(userId, roleId);
    return generalResponse(res, data, 'Latest subscribers fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function nearExpiry(req, res) {
  try {
    const userId = req.user.user_id;
    const roleId = req.user.role_id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const data = await getNearExpirySubscribers(userId, roleId, { page, limit });
    return generalResponse(res, data, 'Near expiry subscribers fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function subscriptionByPhone(req, res) {
  try {
    const phone = (req.query.phone || '').trim();
    if (!validatePhone05(phone)) return errorResponse(res, 'Invalid phone format', 400);
    const userId = req.user.user_id;
    const roleId = req.user.role_id;
    const result = await getSubscriptionByPhone(userId, roleId, phone);
    const data = { ...result };
    if (data.subscriber) data.subscriber.photo = buildFileUrl(req, data.subscriber.photo);
    if (data.plan) {
      data.plan.image = buildFileUrl(req, data.plan.image);
      if (Array.isArray(data.plan.plan_meals)) {
        data.plan.plan_meals = data.plan.plan_meals.map((pm) => {
          const x = { ...pm };
          x.image = buildFileUrl(req, x.image);
          return x;
        });
      }
    }
    return generalResponse(res, data, 'Subscription fetched by phone');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

module.exports = {
  stats,
  latestSubscribers,
  nearExpiry,
  subscriptionByPhone,
};
