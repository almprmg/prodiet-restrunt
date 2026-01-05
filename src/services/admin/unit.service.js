const { Unit } = require('../../../models');

async function getActiveUnits() {
  const rows = await Unit.findAll({
    where: { status: 'active' },
    order: [['id', 'ASC']],
  });
  return rows;
}

module.exports = {
  getActiveUnits,
};
