'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubscriptionPause extends Model {
    static associate(models) {
      SubscriptionPause.belongsTo(models.Subscription, { foreignKey: 'subscription_id', as: 'subscription' });
    }
  }

  SubscriptionPause.init(
    {
      subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pause_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      resume_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      pause_days_requested: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      resume_type: {
        type: DataTypes.ENUM('emergency', 'normal'),
        allowNull: false,
        defaultValue: 'normal',
      },
    },
    {
      sequelize,
      modelName: 'SubscriptionPause',
      tableName: 'subscription_pauses',
      timestamps: true,
      underscored: true,
    }
  );

  return SubscriptionPause;
};
