const { generalResponse, errorResponse } = require('../../utils/response.util');
const { updateFieldsFilter, validatePhone05, buildFileUrl } = require('../../utils/helpers.util');
const {
  createUser,
  updateUser,
  getUsers,
  getUserById,
  activateUser,
  deactivateUser,
  getMe,
  updateMe,
  changePasswordMe,
} = require('../../services/admin/user.service');

async function create(req, res) {
  try {
    const required = updateFieldsFilter(req.body, ['full_name', 'phone', 'username', 'password', 'role_id', 'branch_id'], true);
    const optional = updateFieldsFilter(req.body, ['status'], false);
    const base = { ...required, ...optional };
    const uploaded = req.file || (req.files && (req.files.photo?.[0] || req.files.file?.[0]));
    const photoPath = uploaded ? `uploads/users/${uploaded.filename}` : null;
    const user = await createUser(base, req.user.user_id, photoPath);
    const data = user.toJSON ? user.toJSON() : user;
    data.photo = buildFileUrl(req, data.photo);
    return generalResponse(res, data, 'User created', true, true, 201);
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const payload = updateFieldsFilter(req.body, ['full_name', 'phone', 'username', 'password', 'role_id', 'branch_id', 'status'], false);
    const uploaded = req.file || (req.files && (req.files.photo?.[0] || req.files.file?.[0]));
    const photoPath = uploaded ? `uploads/users/${uploaded.filename}` : undefined;
    const user = await updateUser(id, payload, photoPath);
    const data = user.toJSON ? user.toJSON() : user;
    data.photo = buildFileUrl(req, data.photo);
    return generalResponse(res, data, 'User updated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function list(req, res) {
  try {
    const q = req.query.q || '';
    const status = req.query.status || 'all';
    const branch_id = req.query.branch_id ? parseInt(req.query.branch_id, 10) : undefined;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await getUsers({ q, status, branch_id, page, limit }, req.user.user_id);
    const rows = Array.isArray(result.rows) ? result.rows.map((u) => {
      const json = u.toJSON ? u.toJSON() : u;
      json.photo = buildFileUrl(req, json.photo);
      return json;
    }) : [];
    const data = { ...result, rows };
    return generalResponse(res, data, 'Users fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function findById(req, res) {
  try {
    const id = req.params.id;
    const user = await getUserById(id);
    const data = user.toJSON ? user.toJSON() : user;
    data.photo = buildFileUrl(req, data.photo);
    return generalResponse(res, data, 'User fetched');
  } catch (e) {
    return errorResponse(res, e.message, 404);
  }
}

async function activate(req, res) {
  try {
    const id = req.params.id;
    const user = await activateUser(id);
    const data = user.toJSON ? user.toJSON() : user;
    data.photo = buildFileUrl(req, data.photo);
    return generalResponse(res, data, 'User activated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function deactivate(req, res) {
  try {
    const id = req.params.id;
    const user = await deactivateUser(id);
    const data = user.toJSON ? user.toJSON() : user;
    data.photo = buildFileUrl(req, data.photo);
    return generalResponse(res, data, 'User deactivated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function me(req, res) {
  try {
    const userId = req.user.user_id;
    const data = await getMe(userId);
    data.photo = buildFileUrl(req, data.photo);
    return generalResponse(res, data, 'Profile fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function meUpdate(req, res) {
  try {
    const userId = req.user.user_id;
    const payload = updateFieldsFilter(req.body, ['full_name', 'phone', 'username'], false);
    if (payload.phone !== undefined && !validatePhone05(payload.phone)) {
      return errorResponse(res, 'Invalid phone format', 400);
    }
    const uploaded = req.file || (req.files && (req.files.photo?.[0] || req.files.file?.[0]));
    const photoPath = uploaded ? `uploads/users/${uploaded.filename}` : undefined;
    const data = await updateMe(userId, payload, photoPath);
    data.photo = buildFileUrl(req, data.photo);
    return generalResponse(res, data, 'Profile updated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.user.user_id;
    const required = updateFieldsFilter(req.body, ['old_password', 'new_password', 'confirm_password'], true);
    if (required.new_password !== required.confirm_password) {
      return errorResponse(res, 'Password confirmation does not match', 400);
    }
    await changePasswordMe(userId, required.old_password, required.new_password);
    return generalResponse(res, {}, 'Password changed');
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
  me,
  meUpdate,
  changePassword,
};
