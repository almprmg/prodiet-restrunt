'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Meal extends Model {
    static associate(models) {
      Meal.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
      Meal.belongsTo(models.Category, { foreignKey: 'garnish_category_id', as: 'garnish_category' });
    }
  }

  Meal.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meal_type: {
        type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'),
        allowNull: false,
        defaultValue: 'lunch',
      },
      garnish_category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      state: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Meal',
      tableName: 'meals',
      timestamps: true,
      underscored: true,
    }
  );

  return Meal;
};
