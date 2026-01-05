'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { Role } = require('../models');

    // تحقق عدد الأدوار
    const count = await Role.count();

    // إذا ما في أي دور → أضف الدور الافتراضي
    if (count === 0) {
      await Role.create({
        name: 'SuperAdmin',
        description: '',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const { Role } = require('../models');

    // حذف الدور الافتراضي عند التراجع
    await Role.destroy({
      where: { name: 'SuperAdmin' }
    });
  }
};
