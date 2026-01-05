'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionDeliveryDetail extends Model {
    static associate(models) {
      SubscriptionDeliveryDetail.belongsTo(models.SubscriptionDelivery, { foreignKey: 'delivery_id', as: 'delivery' });
      SubscriptionDeliveryDetail.belongsTo(models.Meal, { foreignKey: 'meal_id', as: 'meal' });
    }
  }

  SubscriptionDeliveryDetail.init(
    {
      delivery_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      meal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'SubscriptionDeliveryDetail',
      tableName: 'subscription_delivery_details',
      timestamps: true,
      underscored: true,
    }
  );

  return SubscriptionDeliveryDetail;
};
