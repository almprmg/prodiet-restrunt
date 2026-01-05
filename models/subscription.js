'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    static associate(models) {
      Subscription.belongsTo(models.Subscriber, { foreignKey: 'subscriber_id', as: 'subscriber' });
      Subscription.belongsTo(models.Plan, { foreignKey: 'plan_id', as: 'plan' });
      Subscription.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
      Subscription.belongsTo(models.Branch, { foreignKey: 'delivery_branch_id', as: 'delivery_branch' });
      Subscription.hasMany(models.SubscriptionCustomization, { foreignKey: 'subscription_id', as: 'customizations' });
      Subscription.hasMany(models.SubscriptionPause, { foreignKey: 'subscription_id', as: 'pauses' });
    }
  }

  Subscription.init(
    {
      subscriber_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount_paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      type: {
        type: DataTypes.ENUM('pickup', 'delivery', 'custom'),
        allowNull: false,
        defaultValue: 'pickup',
      },
      branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      delivery_branch_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      delivery_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('ongoing', 'ended', 'paused', 'archived'),
        allowNull: false,
        defaultValue: 'ongoing',
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Subscription',
      tableName: 'subscriptions',
      timestamps: true,
      underscored: true,
    }
  );

  return Subscription;
};
