const { Workday } = require('../../../models');

async function getWorkdays() {
  const rows = await Workday.findAll({ order: [['id', 'ASC']] });
  return rows;
}

async function updateStatus(id, status) {
  const day = await Workday.findByPk(id);
  if (!day) throw new Error('Workday not found');
  if (!['active', 'inactive'].includes(status)) throw new Error('Invalid status');
  await day.update({ status });
  return day;
}

async function activateWorkday(id) {
  return await updateStatus(id, 'active');
}

async function deactivateWorkday(id) {
  return await updateStatus(id, 'inactive');
}

module.exports = {
  getWorkdays,
  updateStatus,
  activateWorkday,
  deactivateWorkday,
};
