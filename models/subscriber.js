'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subscriber extends Model {
    static associate(models) {
      Subscriber.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
      Subscriber.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
      Subscriber.hasMany(models.Subscription, { foreignKey: 'subscriber_id', as: 'subscriptions' });
    }
  }

  Subscriber.init(
    {
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Subscriber',
      tableName: 'subscribers',
      timestamps: true,
      underscored: true,
    }
  );

  return Subscriber;
};

