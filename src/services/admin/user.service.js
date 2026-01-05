const { User, Role, Permission, Branch } = require('../../../models');
const { Op } = require('sequelize');
const { hashPassword, comparePassword } = require('../../utils/hashPassword.util');
const { validatePhone05 } = require('../../utils/helpers.util');
const { isSuperAdminUser, getRequesterBranchId } = require('../../utils/common.util');

async function createUser(payload, createdBy, photoPath) {
  const status = payload.status || 'active';
  const role = await Role.findByPk(payload.role_id);
  if (!role) throw new Error('Role not found');
  if (role.status !== 'active') throw new Error('Role inactive');
  const branch = await Branch.findByPk(payload.branch_id);
  if (!branch) throw new Error('Branch not found');
  if (branch.status !== 'active' || branch.is_active === false) throw new Error('Branch inactive');
  if (!validatePhone05(payload.phone)) throw new Error('Invalid phone format');
  const usernameExists = await User.findOne({ where: { username: payload.username } });
  if (usernameExists) throw new Error('Username already exists');
  const phoneExists = await User.findOne({ where: { phone: payload.phone } });
  if (phoneExists) throw new Error('Phone already exists');
  const data = {
    full_name: payload.full_name,
    branch_id: payload.branch_id,
    role_id: payload.role_id,
    photo: photoPath || null,
    phone: payload.phone,
    username: payload.username,
    password: await hashPassword(payload.password),
    status,
    created_by: createdBy,
  };
  const user = await User.create(data);
  return await User.findByPk(user.id, {
    include: [
      { model: Role, as: 'role', include: [{ model: Permission, as: 'permissions' }] },
      { model: Branch, as: 'branch' },
    ],
  });
}

async function updateUser(id, payload, photoPath) {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');
  const updates = {};
  if (payload.full_name !== undefined) updates.full_name = payload.full_name;
  if (payload.branch_id !== undefined) updates.branch_id = payload.branch_id;
  if (payload.role_id !== undefined) updates.role_id = payload.role_id;
  if (photoPath !== undefined) updates.photo = photoPath;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.username !== undefined) updates.username = payload.username;
  if (payload.password !== undefined) updates.password = await hashPassword(payload.password);
  if (payload.status !== undefined) updates.status = payload.status;
  await user.update(updates);
  return await User.findByPk(user.id, {
    include: [
      { model: Role, as: 'role', include: [{ model: Permission, as: 'permissions' }] },
      { model: Branch, as: 'branch' },
    ],
  });
}

async function getUsers({ q, status, branch_id, page = 1, limit = 10 }, requesterId) {
  const where = {};
  if (q) {
    where[Op.or] = [
      { full_name: { [Op.iLike]: `%${q}%` } },
      { phone: { [Op.iLike]: `%${q}%` } },
      { username: { [Op.iLike]: `%${q}%` } },
    ];
  }
  if (status && status !== 'all') where.status = status;
  const isSuper = await isSuperAdminUser(requesterId);
  if (isSuper) {
    if (branch_id) where.branch_id = branch_id;
  } else {
    const requesterBranchId = await getRequesterBranchId(requesterId);
    where.branch_id = requesterBranchId;
  }
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const { rows, count } = await User.findAndCountAll({
     distinct: true,
    where,
    offset,
    limit: safeLimit,
    order: [['id', 'ASC']],
    include: [
      { model: Role, as: 'role', include: [{ model: Permission, as: 'permissions' }] },
      { model: Branch, as: 'branch' },
    ],
  });
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows, count, page: safePage, limit: safeLimit, totalPages };
}

async function getUserById(id) {
  const user = await User.findByPk(id, {
    include: [
      { model: Role, as: 'role', include: [{ model: Permission, as: 'permissions' }] },
      { model: Branch, as: 'branch' },
    ],
  });
  if (!user) throw new Error('User not found');
  return user;
}

async function activateUser(id) {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');
  await user.update({ status: 'active' });
  return await getUserById(id);
}

async function deactivateUser(id) {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');
  await user.update({ status: 'inactive' });
  return await getUserById(id);
}

async function getMe(userId) {
  const user = await User.findByPk(userId, {
    include: [
      { model: Role, as: 'role', include: [{ model: Permission, as: 'permissions' }] },
      { model: Branch, as: 'branch' },
    ],
  });
  if (!user) throw new Error('User not found');
  const data = user.toJSON();
  delete data.password;
  return data;
}

async function updateMe(userId, payload, photoPath) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  const updates = {};
  if (payload.full_name !== undefined) updates.full_name = payload.full_name;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.username !== undefined) updates.username = payload.username;
  if (photoPath !== undefined) updates.photo = photoPath;
  await user.update(updates);
  const fresh = await User.findByPk(user.id, {
    include: [
      { model: Role, as: 'role', include: [{ model: Permission, as: 'permissions' }] },
      { model: Branch, as: 'branch' },
    ],
  });
  const data = fresh.toJSON();
  delete data.password;
  return data;
}

async function changePasswordMe(userId, oldPassword, newPassword) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  const ok = await comparePassword(oldPassword, user.password);
  if (!ok) throw new Error('Old password is incorrect');
  const hashed = await hashPassword(newPassword);
  await user.update({ password: hashed });
  return true;
}

module.exports = {
  createUser,
  updateUser,
  getUsers,
  getUserById,
  activateUser,
  deactivateUser,
  getMe,
  updateMe,
  changePasswordMe,
};
