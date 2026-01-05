const { generalResponse, errorResponse } = require('../../utils/response.util');
const { getActiveUnits } = require('../../services/admin/unit.service');

async function list(req, res) {
  try {
    const rows = await getActiveUnits();
    return generalResponse(res, rows, 'Units fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

module.exports = {
  list,
};
