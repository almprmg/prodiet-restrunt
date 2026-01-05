'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('subscription_deliveries', 'meal_id');
    await queryInterface.removeColumn('subscription_deliveries', 'quantity');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('subscription_deliveries', 'meal_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.addColumn('subscription_deliveries', 'quantity', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
  },
};
