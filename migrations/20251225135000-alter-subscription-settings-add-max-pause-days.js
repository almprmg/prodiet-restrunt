'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('subscription_settings', 'max_pause_days', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 7,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('subscription_settings', 'max_pause_days');
  },
};
