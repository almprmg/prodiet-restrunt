'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RoleCustomPermission extends Model {
    static associate(models) {
      RoleCustomPermission.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    }
  }

  RoleCustomPermission.init(
    {
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      can_emergency_pause: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'RoleCustomPermission',
      tableName: 'role_custom_permissions',
      timestamps: true,
      underscored: true,
    }
  );

  return RoleCustomPermission;
};
