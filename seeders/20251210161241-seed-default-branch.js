'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { Branch } = require('../models');

    // احسب عدد الفروع
    const count = await Branch.count();

    // إذا ما في ولا فرع → أضف الفرع الافتراضي
    if (count === 0) {
      await Branch.create({
        name: 'الفرع الرئيسي',
        phone: '0500000000',
        address: 'الطائف',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // حذف الفرع الافتراضي عند التراجع
    const { Branch } = require('../models');
    await Branch.destroy({
      where: { name: 'الفرع الرئيسي' }
    });
  }
};
