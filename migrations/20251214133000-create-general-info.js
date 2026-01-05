'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('general_info', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      org_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      restaurant_phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      restaurant_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      logo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      primary_color: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      secondary_color: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('general_info');
  },
};
