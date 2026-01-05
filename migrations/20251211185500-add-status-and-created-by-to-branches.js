'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // إضافة created_by مع حماية في حال وجود العمود مسبقًا
    const desc = await queryInterface.describeTable('branches');
    if (!desc.created_by) {
      await queryInterface.addColumn('branches', 'created_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('branches', 'created_by');
  },
};
