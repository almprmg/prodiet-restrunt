'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'plans';
    await queryInterface.addColumn(table, 'protein_quantity', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn(table, 'carbs_quantity', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn(table, 'total_meals_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn(table, 'breakfasts_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'lunches_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'dinners_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    const table = 'plans';
    await queryInterface.removeColumn(table, 'protein_quantity');
    await queryInterface.removeColumn(table, 'carbs_quantity');
    await queryInterface.removeColumn(table, 'total_meals_count');
    await queryInterface.removeColumn(table, 'breakfasts_count');
    await queryInterface.removeColumn(table, 'lunches_count');
    await queryInterface.removeColumn(table, 'dinners_count');
  },
};
