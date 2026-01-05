'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('ALTER TYPE "enum_subscriptions_status" ADD VALUE IF NOT EXISTS \'archived\';');
    await queryInterface.addColumn('subscriptions', 'start_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.changeColumn('subscriptions', 'end_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('subscriptions', 'start_date');
    await queryInterface.changeColumn('subscriptions', 'end_date', {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },
};
