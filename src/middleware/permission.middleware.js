const { Permission } = require('../../models');
const { errorResponse } = require('../utils/response.util');

const checkPermission = (screenKey, action) => {
  return async (req, res, next) => {
    try {
      const roleId = req.user && req.user.role_id;
      console.log('roleId', roleId);
      if (!roleId) return errorResponse(res, 'Unauthorized', 403);
      const permission = await Permission.findOne({ where: { role_id: roleId, screen_key: screenKey } });
      if (!permission) return errorResponse(res, 'Forbidden_', 403);
      const key = `can_${action}`;
      if (!permission[key]) return errorResponse(res, 'Forbidden', 403);
      next();
    } catch (e) {
      return errorResponse(res, 'Permission check failed', 500);
    }
  };
};

module.exports = { checkPermission };
