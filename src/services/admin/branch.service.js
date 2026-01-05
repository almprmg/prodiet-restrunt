const { Branch } = require('../../../models');
const { Op } = require('sequelize');

async function createBranch(payload, createdBy) {
  const status = payload.status || 'active';
  const isActive = status === 'active';
  const branch = await Branch.create({
    name: payload.name,
    address: payload.address,
    phone: payload.phone,
    status,
    is_active: isActive,
    created_by: createdBy,
  });
  return branch;
}

async function updateBranch(id, payload) {
  const branch = await Branch.findByPk(id);
  if (!branch) throw new Error('Branch not found');
  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.address !== undefined) updates.address = payload.address;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.status !== undefined) {
    updates.status = payload.status;
    updates.is_active = payload.status === 'active';
  }
  await branch.update(updates);
  return branch;
}

async function getBranches({ q, status, page = 1, limit = 10 }) {
  const where = {};
  if (q) where.name = { [Op.iLike]: `%${q}%` };
  if (status && status !== 'all') where.status = status;
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const { rows, count } = await Branch.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [['id', 'ASC']],
  });
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows, count, page: safePage, limit: safeLimit, totalPages };
}

async function getBranchById(id) {
  const branch = await Branch.findByPk(id);
  if (!branch) throw new Error('Branch not found');
  return branch;
}

async function activateBranch(id) {
  const branch = await Branch.findByPk(id);
  if (!branch) throw new Error('Branch not found');
  await branch.update({ status: 'active', is_active: true });
  return branch;
}

async function deactivateBranch(id) {
  const branch = await Branch.findByPk(id);
  if (!branch) throw new Error('Branch not found');
  await branch.update({ status: 'inactive', is_active: false });
  return branch;
}

module.exports = {
  createBranch,
  updateBranch,
  getBranches,
  getBranchById,
  activateBranch,
  deactivateBranch,
};
