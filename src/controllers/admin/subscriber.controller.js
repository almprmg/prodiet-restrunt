const { generalResponse, errorResponse } = require('../../utils/response.util');
const { updateFieldsFilter, buildFileUrl } = require('../../utils/helpers.util');
const {
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
  normalPauseSubscription
} = require('../../services/admin/subscriber.service');

async function create(req, res) {
  try {
     req.body.subscription = JSON.parse(req.body.subscription);
    const required = updateFieldsFilter(req.body, ['full_name', 'phone'], true);
    const subRequired = updateFieldsFilter(req.body.subscription || {}, ['plan_id'], true);
    const subOptional = updateFieldsFilter(req.body.subscription || {}, ['amount_paid', 'type', 'customizations', 'addons', 'delivery_branch_id', 'delivery_fee'], false);
    const base = { ...required, subscription: { ...subRequired, ...subOptional } };
    const uploaded = req.file || (req.files && (req.files.photo?.[0] || req.files.file?.[0]));
    const photoPath = uploaded ? `uploads/subscribers/${uploaded.filename}` : null;
    const result = await createSubscriberWithSubscription(base, req.user.user_id, photoPath);
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
    return generalResponse(res, data, 'تم إنشاء المشترك والاشتراك بنجاح', true, true, 201);
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const base = updateFieldsFilter(req.body, ['full_name', 'phone'], false);
    const payload = { ...base };
    const uploaded = req.file || (req.files && (req.files.photo?.[0] || req.files.file?.[0]));
    const photoPath = uploaded ? `uploads/subscribers/${uploaded.filename}` : undefined;
    const result = await updateSubscriberAndSubscription(id, payload, photoPath);
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
    return generalResponse(res, data, 'تم تعديل بيانات المشترك بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function updateSubscriptionBranch(req, res) {
  try {
    const id = req.params.id;
    const required = updateFieldsFilter(req.body, ['delivery_branch_id'], true);
    const { updateSubscriptionDeliveryBranch } = require('../../services/admin/subscriber.service');
    const updated = await updateSubscriptionDeliveryBranch(parseInt(id, 10), required.delivery_branch_id, req.user.user_id);
    return generalResponse(res, updated, 'تم تعديل فرع الاستلام للاشتراك بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function list(req, res) {
  try {
    const q = req.query.q || '';
    const branch_id = req.query.branch_id ? parseInt(req.query.branch_id, 10) : undefined;
    const status = req.query.status || 'all';
    const type = req.query.type || 'all';
    const from = req.query.from;
    const to = req.query.to;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await listSubscribersWithCurrentSubscription({ q, branch_id, status, type, from, to, page, limit }, req.user.user_id);
    const rows = Array.isArray(result.rows) ? result.rows.map((row) => {
      const item = { ...row };
      if (item.subscriber) item.subscriber.photo = buildFileUrl(req, item.subscriber.photo);
      if (Array.isArray(item.subscriptions)) {
        item.subscriptions = item.subscriptions.map((s) => {
          const x = { ...s };
          if (x.plan && x.plan.image) x.plan.image = buildFileUrl(req, x.plan.image);
          if (x.plan && Array.isArray(x.plan.plan_meals)) {
            x.plan.plan_meals = x.plan.plan_meals.map((pm) => ({
              ...pm,
              image: buildFileUrl(req, pm.image),
            }));
          }
          return x;
        });
      }
      return item;
    }) : [];
    const data = { ...result, rows };
    return generalResponse(res, data, 'تم جلب المشتركين مع اشتراكاتهم بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function listAll(req, res) {
  try {
    const q = req.query.q || '';
    const branch_id = req.query.branch_id ? parseInt(req.query.branch_id, 10) : undefined;
    const status = req.query.status || 'all';
    const type = req.query.type || 'all';
    const from = req.query.from;
    const to = req.query.to;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await listAllSubscriptions({ q, branch_id, status, type, from, to, page, limit }, req.user.user_id);
    const rows = Array.isArray(result.rows) ? result.rows.map((row) => {
      const sub = row.subscription;
      if (sub && sub.subscriber && sub.subscriber.photo) {
        sub.subscriber.photo = buildFileUrl(req, sub.subscriber.photo);
      }
      if (sub && sub.plan) {
        sub.plan.image = buildFileUrl(req, sub.plan.image);
        if (Array.isArray(sub.plan.plan_meals)) {
          sub.plan.plan_meals = sub.plan.plan_meals.map((pm) => {
            const x = pm;
            if (x.image) x.image = buildFileUrl(req, x.image);
            return x;
          });
        }
      }
      return { subscription: sub };
    }) : [];
    const data = { ...result, rows };
    return generalResponse(res, data, 'تم جلب الاشتراكات بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}
async function previewBySubscriber(req, res) {
  try {
    const id = req.params.id;
    const result = await getPreviewBySubscriberId(id);
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
    return generalResponse(res, data, 'تم جلب معاينة المشترك بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 404);
  }
}

async function previewBySubscription(req, res) {
  try {
    const id = req.params.id;
    const result = await getPreviewBySubscriptionId(id);
    const sub = result.subscription;
    if (sub && sub.subscriber && sub.subscriber.photo) {
      sub.subscriber.photo = buildFileUrl(req, sub.subscriber.photo);
    }
    if (sub && sub.plan) {
      sub.plan.image = buildFileUrl(req, sub.plan.image);
      if (Array.isArray(sub.plan.plan_meals)) {
        sub.plan.plan_meals = sub.plan.plan_meals.map((pm) => {
          const x = pm;
          if (x.image) x.image = buildFileUrl(req, x.image);
          return x;
        });
      }
    }
    return generalResponse(res, { subscription: sub }, 'تم جلب معاينة الاشتراك بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 404);
  }
}

async function pause(req, res) {
  try {
    const id = req.params.id;
    const result = await pauseSubscription(id);
    return generalResponse(res, result, 'Subscription paused');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function resume(req, res) {
  try {
    const id = req.params.id;
    const result = await resumeSubscription(id);
    return generalResponse(res, result, 'Subscription resumed');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function listSubscriptions(req, res) {
  try {
    const subscriberId = req.params.id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await listSubscriptionsBySubscriber(subscriberId, { page, limit });
    return generalResponse(res, result, 'Subscriptions history fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function listPauses(req, res) {
  try {
    const subscriptionId = req.params.id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await listPausesBySubscription(subscriptionId, { page, limit });
    return generalResponse(res, result, 'Pauses history fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function renew(req, res) {
  try {
    const subscriberId = req.params.id;
    const subData = req.body.subscription || req.body;
    const subRequired = updateFieldsFilter(subData || {}, ['plan_id'], true);
    const subOptional = updateFieldsFilter(subData || {}, ['amount_paid', 'type', 'customizations', 'delivery_branch_id', 'delivery_fee', 'addons'], false);
    const payload = { ...subRequired, ...subOptional };
    const result = await renewSubscription(subscriberId, payload, req.user.user_id);
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
    return generalResponse(res, data, 'تم تجديد الاشتراك بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function deliver(req, res) {
  try {
    const subscriptionId = req.body && req.body.subscription_id !== undefined ? parseInt(req.body.subscription_id, 10) : undefined;
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) return errorResponse(res, 'رقم الاشتراك غير صالح', 400);
    if (!Array.isArray(items) || items.length === 0) return errorResponse(res, 'قائمة العناصر مطلوبة', 400);
    const result = await documentSubscriptionDeliveries(subscriptionId, items, req.user.user_id);
    if (result === true) {
      return generalResponse(res, { documented: true }, 'تم توثيق التسليم بنجاح', true, true, 200);
    }
    if (result && result.limit_exceeded) {
      return generalResponse(res, result, 'تم تجاوز الحد اليومي', false, true, 200);
    }
    return generalResponse(res, { documented: false }, 'لم يتم توثيق التسليم', false, true, 200);
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function getSettings(req, res) {
  try {
    const setting = await getSubscriptionSettings();
    const data = setting ? (setting.toJSON ? setting.toJSON() : setting) : {};
    return generalResponse(res, data, 'Subscription settings fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function updateSettings(req, res) {
  try {
    const required = updateFieldsFilter(req.body, ['max_daily_meal_withdrawal'], true);
    const setting = await updateSubscriptionSettings(required.max_daily_meal_withdrawal);
    const data = setting ? (setting.toJSON ? setting.toJSON() : setting) : {};
    return generalResponse(res, data, 'Subscription settings updated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function pauseNormal(req, res) {
  try {
    const id = req.params.id;
    const required = updateFieldsFilter(req.body, ['start_date', 'pause_days'], true);
    const sub = await normalPauseSubscription(id, required.start_date, required.pause_days);
    return generalResponse(res, sub, 'تم جدولة الإيقاف العادي بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function listInventoryToday(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { listTodayKitchenPreparation } = require('../../services/admin/subscriber.service');
    const data = await listTodayKitchenPreparation({ page: parseInt(page, 10), limit: parseInt(limit, 10) });
    const rows = Array.isArray(data.rows) ? data.rows.map((row) => {
      const x = { ...row };
      if (Array.isArray(x.meals)) {
        x.meals = x.meals.map((m) => {
          const mm = { ...m };
          if (mm.meal && mm.meal.image) mm.meal.image = buildFileUrl(req, mm.meal.image);
          return mm;
        });
      }
      return x;
    }) : [];
    return generalResponse(res, { ...data, rows }, 'تم جلب تحضيرات اليوم بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function listInventoryTomorrow(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { listTomorrowKitchenPreparation } = require('../../services/admin/subscriber.service');
    const data = await listTomorrowKitchenPreparation({ page: parseInt(page, 10), limit: parseInt(limit, 10) });
    const rows = Array.isArray(data.rows) ? data.rows.map((row) => {
      const x = { ...row };
      if (Array.isArray(x.meals)) {
        x.meals = x.meals.map((m) => {
          const mm = { ...m };
          if (mm.meal && mm.meal.image) mm.meal.image = buildFileUrl(req, mm.meal.image);
          return mm;
        });
      }
      return x;
    }) : [];
    return generalResponse(res, { ...data, rows }, 'تم جلب تحضيرات الغد بنجاح');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}
module.exports = {
  create,
  update,
  list,
  listAll,
  previewBySubscriber,
  previewBySubscription,
  pause,
  resume,
  pauseNormal,
  listInventoryToday,
  listInventoryTomorrow,
  listSubscriptions,
  listPauses,
  renew,
  deliver,
  async listDeliveries(req, res) {
    try {
      const { q, branch_id, from, to, page = 1, limit = 10 } = req.query;
      const data = await listAllDeliveries({ q, branch_id: branch_id ? parseInt(branch_id, 10) : undefined, from, to, page: parseInt(page, 10), limit: parseInt(limit, 10) }, req.user.user_id);
      return generalResponse(res, data, 'تم جلب التسليمات بنجاح');
    } catch (e) {
      return errorResponse(res, e.message, 400);
    }
  },
  async listDeliveriesBySubscription(req, res) {
    try {
      const subscriptionId = parseInt(req.params.id, 10);
      const { page = 1, limit = 10 } = req.query;
      const data = await listDeliveriesBySubscription(subscriptionId, { page: parseInt(page, 10), limit: parseInt(limit, 10) });
      const rows = Array.isArray(data.rows) ? data.rows.map((row) => {
        const x = { ...row };
        if (x.delivery && x.delivery.subscription && x.delivery.subscription.subscriber && x.delivery.subscription.subscriber.photo) {
          x.delivery.subscription.subscriber.photo = buildFileUrl(req, x.delivery.subscription.subscriber.photo);
        }
        if (x.delivery && x.delivery.subscription && x.delivery.subscription.plan && x.delivery.subscription.plan.image) {
          x.delivery.subscription.plan.image = buildFileUrl(req, x.delivery.subscription.plan.image);
          if (Array.isArray(x.delivery.subscription.plan.plan_meals)) {
            x.delivery.subscription.plan.plan_meals = x.delivery.subscription.plan.plan_meals.map((pm) => ({
              ...pm,
              image: buildFileUrl(req, pm.image),
            }));
          }
        }
        if (x.delivery && Array.isArray(x.delivery.details)) {
          x.delivery.details = x.delivery.details.map((d) => {
            const dd = d.toJSON ? d.toJSON() : d;
            if (dd.meal && dd.meal.image) dd.meal.image = buildFileUrl(req, dd.meal.image);
            return dd;
          });
        }
        return x;
      }) : [];
      const result = { ...data, rows };
      return generalResponse(res, result, 'تم جلب تسليمات الاشتراك بنجاح');
    } catch (e) {
      return errorResponse(res, e.message, 400);
    }
  },
  getSettings,
  updateSettings,
  updateSubscriptionBranch,
};
