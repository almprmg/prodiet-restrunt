'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionAddon extends Model {
    static associate(models) {
      SubscriptionAddon.belongsTo(models.Subscription, { foreignKey: 'subscription_id', as: 'subscription' });
      SubscriptionAddon.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
    }
  }

  SubscriptionAddon.init(
    {
      subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'SubscriptionAddon',
      tableName: 'subscription_addons',
      timestamps: true,
      underscored: true,
    }
  );

  return SubscriptionAddon;
};
