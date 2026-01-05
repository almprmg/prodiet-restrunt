'use strict';

const { hashPassword } = require('../src/utils/hashPassword.util');

module.exports = {
  async up(queryInterface, Sequelize) {
    const { User } = require('../models');

    // تحقق إذا كان هناك أي مستخدم
    const count = await User.count();

    if (count === 0) {
      const hashedPassword = await hashPassword('admin@123'); // استخدام الدالة من utils

      await User.create({
        full_name: 'Admin',
        branch_id: 1,
        role_id: 1,
        photo: null,
        phone: '0500000000',
        username: 'admin',
        password: hashedPassword,
      });

      console.log('تم إنشاء المستخدم الافتراضي بنجاح');
    }
  },

  async down(queryInterface, Sequelize) {
    const { User } = require('../models');
    await User.destroy({
      where: { username: 'admin' },
    });
  }
};
