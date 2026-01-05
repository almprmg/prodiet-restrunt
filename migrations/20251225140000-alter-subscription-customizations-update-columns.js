'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'subscription_customizations';
    try { await queryInterface.removeColumn(table, 'quantity'); } catch (e) {}
    try { await queryInterface.removeColumn(table, 'unit_id'); } catch (e) {}
    await queryInterface.addColumn(table, 'protein_quantity', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'carbs_quantity', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    const table = 'subscription_customizations';
    try { await queryInterface.removeColumn(table, 'protein_quantity'); } catch (e) {}
    try { await queryInterface.removeColumn(table, 'carbs_quantity'); } catch (e) {}
    await queryInterface.addColumn(table, 'quantity', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn(table, 'unit_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },
};
