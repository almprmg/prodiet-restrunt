'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    static associate(models) {
      // الربط مع Roles
      Permission.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    }
  }

  Permission.init(
    {
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      screen_key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      can_add: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      can_edit: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      can_delete: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      can_view: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      can_print: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'Permission',
      tableName: 'permissions',
      timestamps: true,
    }
  );

  return Permission;
};
