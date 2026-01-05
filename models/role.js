'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     */
    static associate(models) {
      // لاحقًا سنضيف العلاقة مع Permissions أو Users
      Role.hasMany(models.Permission, {
        foreignKey: 'role_id',
        as: 'permissions' // 👈 يجب أن يتطابق مع include في الاستعلام
      });
      Role.hasMany(models.User, {
        foreignKey: 'role_id',
        as: 'users' // 👈 يجب أن يتطابق مع include في الاستعلام
      });
    }
  }

  Role.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
  });

  return Role;
};
