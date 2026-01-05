const { generalResponse, errorResponse } = require('../../utils/response.util');
const { getWorkdays, updateStatus, activateWorkday, deactivateWorkday } = require('../../services/admin/workday.service');

async function list(req, res) {
  try {
    const rows = await getWorkdays();
    return generalResponse(res, rows, 'Workdays fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const { status } = req.body;
    const day = await updateStatus(id, status);
    return generalResponse(res, day, 'Workday status updated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function activate(req, res) {
  try {
    const id = req.params.id;
    const day = await activateWorkday(id);
    return generalResponse(res, day, 'Workday activated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function deactivate(req, res) {
  try {
    const id = req.params.id;
    const day = await deactivateWorkday(id);
    return generalResponse(res, day, 'Workday deactivated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

module.exports = {
  list,
  update,
  activate,
  deactivate,
};
