'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // علاقات المستخدم مع الدور والفرع
      User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
      User.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
      User.hasMany(models.Branch, { foreignKey: 'created_by', as: 'created_branches' });
    }
  }

  User.init(
    {
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true,
    }
  );

  return User;
};
