'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Plan extends Model {
    static associate(models) {
      Plan.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
      Plan.hasMany(models.PlanMeal, { foreignKey: 'plan_id', as: 'plan_meals' });
    }
  }

  Plan.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      duration_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('normal', 'custom'),
        allowNull: false,
        defaultValue: 'normal',
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
      total_meals_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      breakfasts_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      lunches_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      dinners_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Plan',
      tableName: 'plans',
      timestamps: true,
      underscored: true,
    }
  );

  return Plan;
};
