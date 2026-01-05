'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.rawSelect('general_info', {}, ['id']);
    if (exists) return;
    await queryInterface.bulkInsert('general_info', [
      {
        org_name: 'Prodiet',
        restaurant_phone: '0500000000',
        restaurant_email: 'info@prodiet.local',
        logo: null,
        primary_color: '#1abc9c',
        secondary_color: '#34495e',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('general_info', null, {});
  },
};
