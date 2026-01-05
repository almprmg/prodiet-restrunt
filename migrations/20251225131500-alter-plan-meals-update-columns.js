'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'plan_meals';
    // Remove old columns
    try { await queryInterface.removeColumn(table, 'unit_id'); } catch (e) {}
    try { await queryInterface.removeColumn(table, 'quantity'); } catch (e) {}
    // Add new columns
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
    await queryInterface.addColumn(table, 'allowed_meals_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    const table = 'plan_meals';
    // Remove new columns
    try { await queryInterface.removeColumn(table, 'protein_quantity'); } catch (e) {}
    try { await queryInterface.removeColumn(table, 'carbs_quantity'); } catch (e) {}
    try { await queryInterface.removeColumn(table, 'allowed_meals_count'); } catch (e) {}
    // Re-add old columns
    await queryInterface.addColumn(table, 'unit_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
    });
    await queryInterface.addColumn(table, 'quantity', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },
};
