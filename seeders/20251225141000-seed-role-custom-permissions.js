'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM role_custom_permissions WHERE role_id = 1 LIMIT 1`
    );
    if (existing && existing.length > 0) return;
    await queryInterface.bulkInsert('role_custom_permissions', [
      {
        role_id: 1,
        can_emergency_pause: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_custom_permissions', { role_id: 1 });
  },
};
