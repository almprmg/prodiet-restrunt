'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PlanMeal extends Model {
    static associate(models) {
      PlanMeal.belongsTo(models.Plan, { foreignKey: 'plan_id', as: 'plan' });
      PlanMeal.belongsTo(models.Workday, { foreignKey: 'workday_id', as: 'workday' });
      PlanMeal.belongsTo(models.Meal, { foreignKey: 'meal_id', as: 'meal' });
    }
  }

  PlanMeal.init(
    {
      plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      workday_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      meal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      protein_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      carbs_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      allowed_meals_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'PlanMeal',
      tableName: 'plan_meals',
      timestamps: true,
      underscored: true,
    }
  );

  return PlanMeal;
};
