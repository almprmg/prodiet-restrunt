const { User } = require('../../models');

const isSuperAdminUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('Requester not found');
  return user.id === 1;
};

const getRequesterBranchId = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('Requester not found');
  return user.branch_id;
};

module.exports = {
  isSuperAdminUser,
  getRequesterBranchId,
};
