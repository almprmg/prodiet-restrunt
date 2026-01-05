const { generalResponse, errorResponse } = require('../../utils/response.util');
const { updateFieldsFilter, buildFileUrl } = require('../../utils/helpers.util');
const { getGeneralInfo, updateGeneralInfo } = require('../../services/admin/generalinfo.service');

async function get(req, res) {
  try {
    const info = await getGeneralInfo();
    const data = info ? (info.toJSON ? info.toJSON() : info) : {};
    if (data.logo) data.logo = buildFileUrl(req, data.logo);
    return generalResponse(res, data || {}, 'General info fetched');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

async function update(req, res) {
  try {
    const payload = updateFieldsFilter(req.body, ['org_name', 'restaurant_phone', 'restaurant_email', 'primary_color', 'secondary_color'], false);
    const uploaded = req.file || (req.files && (req.files.logo?.[0] || req.files.photo?.[0] || req.files.file?.[0]));
    const logoPath = uploaded ? `uploads/general/${uploaded.filename}` : undefined;
    const info = await updateGeneralInfo(payload, logoPath);
    const data = info ? (info.toJSON ? info.toJSON() : info) : {};
    if (data.logo) data.logo = buildFileUrl(req, data.logo);
    return generalResponse(res, data, 'General info updated');
  } catch (e) {
    return errorResponse(res, e.message, 400);
  }
}

module.exports = {
  get,
  update,
};
