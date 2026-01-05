'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      subscriber_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'subscribers', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      plan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'plans', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      amount_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      type: {
        type: Sequelize.ENUM('pickup', 'delivery', 'custom'),
        allowNull: false,
        defaultValue: 'pickup',
      },
      branch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'branches', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('ongoing', 'ended', 'paused'),
        allowNull: false,
        defaultValue: 'ongoing',
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
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
    await queryInterface.dropTable('subscriptions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_subscriptions_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_subscriptions_status";');
  },
};

