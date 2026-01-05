'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles', // الربط بجدول Roles
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      screen_key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      can_add: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      can_edit: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      can_delete: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      can_view: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      can_print: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('permissions');
  },
};
