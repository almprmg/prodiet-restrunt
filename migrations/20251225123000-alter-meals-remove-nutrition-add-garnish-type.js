'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove old nutrition columns
    const table = 'meals';
    const removals = ['calories', 'protein', 'carbs', 'fats'];
    for (const col of removals) {
      try {
        await queryInterface.removeColumn(table, col);
      } catch (e) {}
    }
    // Add garnish_category_id (nullable FK to categories)
    await queryInterface.addColumn(table, 'garnish_category_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'categories', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    // Add meal_type enum
    await queryInterface.addColumn(table, 'meal_type', {
      type: Sequelize.ENUM('breakfast', 'lunch', 'dinner'),
      allowNull: false,
      defaultValue: 'lunch',
    });
  },

  async down(queryInterface, Sequelize) {
    const table = 'meals';
    // Remove new columns
    try {
      await queryInterface.removeColumn(table, 'garnish_category_id');
    } catch (e) {}
    try {
      await queryInterface.removeColumn(table, 'meal_type');
    } catch (e) {}
    // Attempt to drop enum type (Postgres)
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_meals_meal_type";');
    } catch (e) {}
    // Re-add nutrition columns
    await queryInterface.addColumn(table, 'calories', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn(table, 'protein', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'carbs', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'fats', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },
};
