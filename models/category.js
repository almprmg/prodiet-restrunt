'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {}
  }

  Category.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('snack_full', 'snack', 'salads', 'garnish'),
        allowNull: false,
        defaultValue: 'snack_full',
      },
      status: {
        type: DataTypes.ENUM('active', 'delete'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'categories',
      timestamps: true,
      underscored: true,
    }
  );

  return Category;
};
