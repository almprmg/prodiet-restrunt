'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionDelivery extends Model {
    static associate(models) {
      SubscriptionDelivery.belongsTo(models.Subscription, { foreignKey: 'subscription_id', as: 'subscription' });
      SubscriptionDelivery.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
      SubscriptionDelivery.hasMany(models.SubscriptionDeliveryDetail, { foreignKey: 'delivery_id', as: 'details' });
    }
  }

  SubscriptionDelivery.init(
    {
      subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      branch_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'SubscriptionDelivery',
      tableName: 'subscription_deliveries',
      timestamps: true,
      underscored: true,
    }
  );

  return SubscriptionDelivery;
};
