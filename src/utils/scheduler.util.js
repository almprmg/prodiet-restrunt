const { Subscription, Plan, SubscriptionPause } = require('../../models');
const { Op } = require('sequelize');
const { addDays } = require('./helpers.util');

let scheduled = false;

const formatDateOnly = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

async function markExpiredSubscriptions() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = formatDateOnly(today);
  await Subscription.update(
    { status: 'ended' },
    { where: { status: 'ongoing', end_date: { [Op.lte]: todayStr } } }
  );
}

async function processExpiryAndActivateRenewals() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = formatDateOnly(today);
  const endingSubs = await Subscription.findAll({
    where: { status: 'ongoing', end_date: { [Op.lte]: todayStr } },
    attributes: ['id', 'subscriber_id', 'plan_id'],
    order: [['id', 'ASC']],
  });
  if (endingSubs.length > 0) {
    await Subscription.update(
      { status: 'ended' },
      { where: { status: 'ongoing', end_date: { [Op.lte]: todayStr } } }
    );
  }
  for (const s of endingSubs) {
    const archived = await Subscription.findOne({
      where: { subscriber_id: s.subscriber_id, status: 'archived' },
      order: [['id', 'ASC']],
    });
    if (archived) {
      const plan = await Plan.findByPk(archived.plan_id);
      if (!plan) continue;
      const endDate = addDays(today, plan.duration_days);
      await archived.update({
        status: 'ongoing',
        start_date: todayStr,
        end_date: endDate,
      });
    }
  }
}

async function processNormalPauseAutoResume() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = formatDateOnly(today);
  const pauses = await SubscriptionPause.findAll({
    where: {
      resume_type: 'normal',
      resume_date: { [Op.lte]: todayStr },
    },
  });
  for (const p of pauses) {
    const sub = await Subscription.findByPk(p.subscription_id);
    if (!sub) continue;
    if (sub.status !== 'paused') continue;
    if (sub.status === 'ended') continue;
    const addDaysCount = Number(p.pause_days_requested) || 0;
    const newEnd = addDays(sub.end_date, addDaysCount);
    await sub.update({ status: 'ongoing', end_date: newEnd });
  }
}

async function processNormalPauseAutoStart() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = formatDateOnly(today);
  const pauses = await SubscriptionPause.findAll({
    where: {
      resume_type: 'normal',
      pause_date: todayStr,
    },
  });
  for (const p of pauses) {
    const sub = await Subscription.findByPk(p.subscription_id);
    if (!sub) continue;
    if (sub.status !== 'ongoing') continue;
    await sub.update({ status: 'paused' });
  }
}
function scheduleDailySubscriptionExpiryCheck() {
  if (scheduled) return;
  scheduled = true;
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  const delay = next.getTime() - now.getTime();
  setTimeout(async function run() {
    try {
      await processExpiryAndActivateRenewals();
      await processNormalPauseAutoStart();
      await processNormalPauseAutoResume();
    } catch {}
    scheduled = false;
    scheduleDailySubscriptionExpiryCheck();
  }, delay);
}

function ensureExpiryScheduler() {
  scheduleDailySubscriptionExpiryCheck();
}

module.exports = {
  markExpiredSubscriptions,
  processExpiryAndActivateRenewals,
  processNormalPauseAutoResume,
  processNormalPauseAutoStart,
  scheduleDailySubscriptionExpiryCheck,
  ensureExpiryScheduler,
};
