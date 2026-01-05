'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.rawSelect('subscription_settings', {}, ['id']);
    if (exists) return;
    await queryInterface.bulkInsert('subscription_settings', [
      {
        max_daily_meal_withdrawal: 3,
        max_pause_days: 7,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('subscription_settings', null, {});
  },
};
