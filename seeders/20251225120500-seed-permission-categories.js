'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM permissions WHERE role_id = 1 AND screen_key = 'Categories' LIMIT 1`
    );
    if (existing && existing.length > 0) return;
    await queryInterface.bulkInsert('permissions', [
      {
        role_id: 1,
        screen_key: 'Categories',
        can_add: true,
        can_edit: true,
        can_delete: true,
        can_view: true,
        can_print: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', { screen_key: 'Categories' });
  },
};
