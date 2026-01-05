'use strict';
const { RoleCustomPermission } = require('../../models');
const { errorResponse } = require('../utils/response.util');

const checkEmergencyPausePermission = () => {
  return async (req, res, next) => {
    try {
      const roleId = req.user && req.user.role_id;
      if (!roleId) return errorResponse(res, 'غير مصرح', 403);
      const perm = await RoleCustomPermission.findOne({ where: { role_id: roleId } });
      if (!perm || perm.can_emergency_pause !== true) {
        return errorResponse(res, 'لا تملك صلاحية الإيقاف الطارئ', 403);
      }
      next();
    } catch (e) {
      return errorResponse(res, 'فشل التحقق من الصلاحية المخصصة', 500);
    }
  };
};

module.exports = { checkEmergencyPausePermission };
