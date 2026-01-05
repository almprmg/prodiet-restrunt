const { Role, Permission, sequelize } = require('../../../models');
const { Op } = require('sequelize');

async function createRoleWithPermissions(payload, createdBy) {
  return await sequelize.transaction(async (t) => {
    const status = payload.status || 'active';
    const role = await Role.create(
      {
        name: payload.name,
        description: payload.description,
        status,
        created_by: createdBy,
      },
      { transaction: t }
    );

    const perms = Array.isArray(payload.permissions) ? payload.permissions : [];
    if (perms.length > 0) {
      const rows = perms.map((p) => ({
        role_id: role.id,
        screen_key: p.screen_key,
        can_add: !!p.can_add,
        can_edit: !!p.can_edit,
        can_delete: !!p.can_delete,
        can_view: !!p.can_view,
        can_print: !!p.can_print,
      }));
      await Permission.bulkCreate(rows, { transaction: t });
    }
    const withPerms = await Role.findByPk(role.id, {
      include: [{ model: Permission, as: 'permissions' }],
      transaction: t,
    });
    return withPerms;
  });
}

async function updateRoleWithPermissions(id, payload) {
  return await sequelize.transaction(async (t) => {
    const role = await Role.findByPk(id, { transaction: t });
    if (!role) throw new Error('Role not found');
    if (role.id === 1 || role.name === 'SuperAdmin') throw new Error('SuperAdmin role cannot be modified');

    const updates = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.status !== undefined) updates.status = payload.status;
    await role.update(updates, { transaction: t });

    if (Array.isArray(payload.permissions)) {
      await Permission.destroy({ where: { role_id: role.id }, transaction: t });
      if (payload.permissions.length > 0) {
        const rows = payload.permissions.map((p) => ({
          role_id: role.id,
          screen_key: p.screen_key,
          can_add: !!p.can_add,
          can_edit: !!p.can_edit,
          can_delete: !!p.can_delete,
          can_view: !!p.can_view,
          can_print: !!p.can_print,
        }));
        await Permission.bulkCreate(rows, { transaction: t });
      }
    }

    const withPerms = await Role.findByPk(role.id, {
      include: [{ model: Permission, as: 'permissions' }],
      transaction: t,
    });
    return withPerms;
  });
}

async function getRoles({ q, status, page = 1, limit = 10 }) {
  const where = {};
  if (q) where.name = { [Op.iLike]: `%${q}%` };
  if (status && status !== 'all') where.status = status;
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const offset = (safePage - 1) * safeLimit;
  const { rows, count } = await Role.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [['id', 'ASC']],
  });
  const totalPages = Math.max(1, Math.ceil(count / safeLimit));
  return { rows, count, page: safePage, limit: safeLimit, totalPages };
}

async function getRoleById(id) {
  const role = await Role.findByPk(id, {
    include: [{ model: Permission, as: 'permissions' }],
  });
  if (!role) throw new Error('Role not found');
  return role;
}

async function activateRole(id) {
  const role = await Role.findByPk(id);
  if (!role) throw new Error('Role not found');
  if (role.id === 1 || role.name === 'SuperAdmin') throw new Error('SuperAdmin role cannot be modified');
  await role.update({ status: 'active' });
  return role;
}

async function deactivateRole(id) {
  const role = await Role.findByPk(id);
  if (!role) throw new Error('Role not found');
  if (role.id === 1 || role.name === 'SuperAdmin') throw new Error('SuperAdmin role cannot be modified');
  await role.update({ status: 'inactive' });
  return role;
}

module.exports = {
  createRoleWithPermissions,
  updateRoleWithPermissions,
  getRoles,
  getRoleById,
  activateRole,
  deactivateRole,
};
