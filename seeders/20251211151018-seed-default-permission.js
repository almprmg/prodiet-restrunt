'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { Permission } = require('../models');

    // تحقق عدد الصلاحيات
    const count = await Permission.count();
    if (count > 0) return; // إذا موجودة مسبقًا، لا نفعل شيئًا

    // مصفوفة الشاشات والصلاحيات الافتراضية
    const screens = [
      'Dashboard',
      'Users',
      'Branches',
      'Subscribers',
      'RolesAndPermissions',
      'Meals',
      'Plans',
      'StockManagment',
      'WorksDays',
      'GeneralInfo',
      'SubscriptionSettings'
    ];

    const defaultPermissions = screens.map(screen => ({
      role_id: 1,
      screen_key: screen,
      can_add: true,
      can_edit: true,
      can_delete: true,
      can_view: true,
      can_print: true,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    // إنشاء الصلاحيات
    await Permission.bulkCreate(defaultPermissions);
  },

  async down(queryInterface, Sequelize) {
    const { Permission } = require('../models');

    // حذف جميع الصلاحيات للدور 1
    await Permission.destroy({
      where: { role_id: 1 }
    });
  }
};
