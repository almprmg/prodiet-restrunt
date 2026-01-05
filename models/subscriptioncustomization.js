'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionCustomization extends Model {
    static associate(models) {
      SubscriptionCustomization.belongsTo(models.Subscription, { foreignKey: 'subscription_id', as: 'subscription' });
      SubscriptionCustomization.belongsTo(models.Plan, { foreignKey: 'plan_id', as: 'plan' });
      SubscriptionCustomization.belongsTo(models.Meal, { foreignKey: 'prev_meal_id', as: 'prev_meal' });
      SubscriptionCustomization.belongsTo(models.Meal, { foreignKey: 'new_meal_id', as: 'new_meal' });
    }
  }

  SubscriptionCustomization.init(
    {
      subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      prev_meal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      new_meal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      protein_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      carbs_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      allowed_meals_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'SubscriptionCustomization',
      tableName: 'subscription_customizations',
      timestamps: true,
      underscored: true,
    }
  );

  return SubscriptionCustomization;
};
