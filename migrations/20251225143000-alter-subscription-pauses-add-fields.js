'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'subscription_pauses';
    await queryInterface.addColumn(table, 'pause_days_requested', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'resume_type', {
      type: Sequelize.ENUM('emergency', 'normal'),
      allowNull: false,
      defaultValue: 'normal',
    });
  },

  async down(queryInterface, Sequelize) {
    const table = 'subscription_pauses';
    await queryInterface.removeColumn(table, 'pause_days_requested');
    await queryInterface.removeColumn(table, 'resume_type');
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_subscription_pauses_resume_type";');
    } catch (e) {}
  },
};
