'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Workday extends Model {
    static associate(models) {}
  }

  Workday.init(
    {
      name_ar: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name_en: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      sequelize,
      modelName: 'Workday',
      tableName: 'workdays',
      timestamps: true,
      underscored: true,
    }
  );

  return Workday;
};
