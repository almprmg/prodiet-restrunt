'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GeneralInfo extends Model {
    static associate(models) {}
  }

  GeneralInfo.init(
    {
      org_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      restaurant_phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      restaurant_email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      logo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      primary_color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      secondary_color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'GeneralInfo',
      tableName: 'general_info',
      timestamps: true,
      underscored: true,
    }
  );

  return GeneralInfo;
};
