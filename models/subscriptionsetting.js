'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionSetting extends Model {
    static associate(models) {}
  }

  SubscriptionSetting.init(
    {
      max_daily_meal_withdrawal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      max_pause_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 7,
      },
    },
    {
      sequelize,
      modelName: 'SubscriptionSetting',
      tableName: 'subscription_settings',
      timestamps: true,
      underscored: true,
    }
  );

  return SubscriptionSetting;
};
