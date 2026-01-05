const { Subscriber, Subscription, Plan, Branch, User } = require('../../../models');
const { Op } = require('sequelize');
const { getRequesterBranchId } = require('../../utils/common.util');
const { addDays } = require('../../utils/helpers.util');
const { buildEffectivePlanForSubscription } = require('./subscriber.service');

async function getDashboardStats(requesterId, roleId) {
  const isSuper = roleId === 1;
  const whereSubscriber = {};
  const whereUser = {};
  const whereSubscriptionCurrent = {};
  if (!isSuper) {
    const branchId = await getRequesterBranchId(requesterId);
    whereSubscriber.branch_id = branchId;
    whereUser.branch_id = branchId;
    whereSubscriptionCurrent.branch_id = branchId;
  }
  const totalSubscribers = await Subscriber.count({ where: whereSubscriber });
  const employeesCount = await User.count({ where: whereUser });
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const startCurrent = new Date(Date.UTC(y, m, 1));
  const startNext = new Date(Date.UTC(y, m + 1, 1));
  const startPrev = new Date(Date.UTC(y, m - 1, 1));
  const whereCurrentMonth = { created_at: { [Op.gte]: startCurrent, [Op.lt]: startNext } };
  const wherePrevMonth = { created_at: { [Op.gte]: startPrev, [Op.lt]: startCurrent } };
  const currentMonthSubs = await Subscription.count({
    where: { ...whereSubscriptionCurrent, ...whereCurrentMonth },
  });
  const prevMonthSubs = await Subscription.count({
    where: { ...whereSubscriptionCurrent, ...wherePrevMonth },
  });
  const growthRate = prevMonthSubs === 0 ? (currentMonthSubs > 0 ? 100 : 0) : ((currentMonthSubs - prevMonthSubs) / prevMonthSubs) * 100;
  const result = {
    totalSubscribers,
    subscriptionGrowthRate: Number(growthRate.toFixed(2)),
    employeesCount,
  };
  if (isSuper) {
    const branchesCount = await Branch.count();
    result.branchesCount = branchesCount;
  }
  return result;
}

async function getLatestSubscribers(requesterId, roleId) {
  const isSuper = roleId === 1;
  const whereSubscriber = {};
  if (!isSuper) {
    const branchId = await getRequesterBranchId(requesterId);
    whereSubscriber.branch_id = branchId;
  }
  const subs = await Subscriber.findAll({
    where: whereSubscriber,
    order: [['id', 'DESC']],
    limit: 10,
  });
  const rows = [];
  for (const s of subs) {
    const latestSub = await Subscription.findOne({
      where: { subscriber_id: s.id },
      order: [['id', 'DESC']],
      include: [{ model: Plan, as: 'plan', attributes: ['id', 'name'] }],
    });
    rows.push({
      subscriber_id: s.id,
      full_name: s.full_name,
      phone: s.phone,
      subscription_id: latestSub ? latestSub.id : null,
      plan_name: latestSub && latestSub.plan ? latestSub.plan.name : null,
      end_date: latestSub ? latestSub.end_date : null,
      type: latestSub ? latestSub.type : null,
    });
  }
  return rows;
}

async function getNearExpirySubscribers(requesterId, roleId, { page = 1, limit = 10 }) {
  const isSuper = roleId === 1;
  const where = { status: 'ongoing' };
  if (!isSuper) {
    const branchId = await getRequesterBranchId(requesterId);
    where.branch_id = branchId;
  }
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const maxDate = addDays(today, 5);
  where.end_date = { [Op.gte]: today, [Op.lte]: maxDate };
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const { rows, count } = await Subscription.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [['end_date', 'ASC']],
    include: [
      { model: Subscriber, as: 'subscriber', attributes: ['id', 'full_name', 'phone'], include: [{ model: Branch, as: 'branch', attributes: ['id', 'name'] }] },
      { model: Branch, as: 'branch', attributes: ['id', 'name'] },
      { model: Plan, as: 'plan', attributes: ['id', 'name'] },
    ],
  });
  const todayTime = today.getTime();
  const mapped = rows.map((s) => {
    const end = new Date(s.end_date);
    const endTime = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
    const daysRemaining = Math.max(0, Math.ceil((endTime - todayTime) / (24 * 60 * 60 * 1000)));
    return {
      subscription_id: s.id,
      subscriber_id: s.subscriber ? s.subscriber.id : null,
      full_name: s.subscriber ? s.subscriber.full_name : null,
      phone: s.subscriber ? s.subscriber.phone : null,
      branch: s.branch ? { id: s.branch.id, name: s.branch.name } : null,
      plan_name: s.plan ? s.plan.name : null,
      end_date: s.end_date,
      days_remaining: daysRemaining,
      type: s.type,
    };
  });
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows: mapped, count, page: safePage, limit: safeLimit, totalPages };
}

async function getSubscriptionByPhone(requesterId, roleId, phone) {
  const isSuper = roleId === 1;
  const whereSubscriber = { phone };
  if (!isSuper) {
    const branchId = await getRequesterBranchId(requesterId);
    whereSubscriber.branch_id = branchId;
  }
  const subscriber = await Subscriber.findOne({ where: whereSubscriber });
  if (!subscriber) throw new Error('Subscriber not found');
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const current = await Subscription.findOne({
    where: {
      subscriber_id: subscriber.id,
      status: { [Op.ne]: 'ended' },
      end_date: { [Op.gte]: todayStart },
    },
    order: [['id', 'DESC']],
    include: [{ model: Plan, as: 'plan' }],
  });
  const picked = current
    ? current
    : await Subscription.findOne({
        where: { subscriber_id: subscriber.id },
        order: [['id', 'DESC']],
        include: [{ model: Plan, as: 'plan' }],
      });
  if (!picked) return { subscriber, subscription: null, plan: null, is_current: null };
  const end = picked.end_date ? new Date(picked.end_date) : null;
  const isCurrent = !!(picked.status !== 'ended' && end && end.getTime() >= todayStart.getTime());
  const planEffective = await buildEffectivePlanForSubscription(picked.id);
  return { subscriber, subscription: picked, plan: planEffective, is_current: isCurrent };
}

module.exports = {
  getDashboardStats,
  getLatestSubscribers,
  getNearExpirySubscribers,
  getSubscriptionByPhone,
};
