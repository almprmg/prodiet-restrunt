const { generalResponse, errorResponse } = require('../../utils/response.util');
const { updateFieldsFilter } = require('../../utils/helpers.util');
const {
  createRoleWithPermissions,
  updateRoleWithPermissions,
  getRoles,
  getRoleById,
  activateRole,
  deactivateRole,
} = require('../../services/admin/role.service');

async function create(req, res) {
  try {
    const required = updateFieldsFilter(req.body, ['name'], true);
    const optional = updateFieldsFilter(req.body, ['description', 'status'], false);
    const base = { ...required, ...optional };
    if (!Array.isArray(req.body.permissions)) {
      return errorResponse(res, 'permissions are required', 400);
    }
    const role = await createRoleWithPermissions({ ...base, permissions: req.body.permissions }, req.user.user_id);
    return generalResponse(res, role, 'Role created', true, true, 201);
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const base = updateFieldsFilter(req.body, ['name', 'description', 'status'], false);
    const payload = { ...base };
    if (Array.isArray(req.body.permissions)) payload.permissions = req.body.permissions;
    const role = await updateRoleWithPermissions(id, payload);
    return generalResponse(res, role, 'Role updated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function list(req, res) {
  try {
    const q = req.query.q || '';
    const status = req.query.status || 'all';
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await getRoles({ q, status, page, limit });
    return generalResponse(res, result, 'Roles fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function findById(req, res) {
  try {
    const id = req.params.id;
    const role = await getRoleById(id);
    return generalResponse(res, role, 'Role fetched');
  } catch (e) {
    return errorResponse(res, e.message, 404);
  }
}

async function activate(req, res) {
  try {
    const id = req.params.id;
    const role = await activateRole(id);
    return generalResponse(res, role, 'Role activated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function deactivate(req, res) {
  try {
    const id = req.params.id;
    const role = await deactivateRole(id);
    return generalResponse(res, role, 'Role deactivated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

module.exports = {
  create,
  update,
  list,
  findById,
  activate,
  deactivate,
};
