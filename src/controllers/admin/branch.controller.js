const { generalResponse, errorResponse } = require('../../utils/response.util');
const { updateFieldsFilter } = require('../../utils/helpers.util');
const {
  createBranch,
  updateBranch,
  getBranches,
  getBranchById,
  activateBranch,
  deactivateBranch,
} = require('../../services/admin/branch.service');

async function create(req, res) {
  try {
    const data = updateFieldsFilter(req.body, ['name', 'address', 'phone'], true);
    const branch = await createBranch(data, req.user.user_id);
    return generalResponse(res, branch, 'Branch created', true, true, 201);
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const data = updateFieldsFilter(req.body, ['name', 'address', 'phone', 'status'], false);
    const branch = await updateBranch(id, data);
    return generalResponse(res, branch, 'Branch updated');
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
    const result = await getBranches({ q, status, page, limit });
    return generalResponse(res, result, 'Branches fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function findById(req, res) {
  try {
    const id = req.params.id;
    const branch = await getBranchById(id);
    return generalResponse(res, branch, 'Branch fetched');
  } catch (e) {
    return errorResponse(res, e.message, 404);
  }
}

async function activate(req, res) {
  try {
    const id = req.params.id;
    const branch = await activateBranch(id);
    return generalResponse(res, branch, 'Branch activated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function deactivate(req, res) {
  try {
    const id = req.params.id;
    const branch = await deactivateBranch(id);
    return generalResponse(res, branch, 'Branch deactivated');
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
