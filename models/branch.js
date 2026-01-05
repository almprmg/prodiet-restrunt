'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Branch extends Model {
    static associate(models) {
      // العلاقات هنا لاحقًا
       // كل فرع تمت إضافته بواسطة مستخدم
       Branch.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });

       // الفرع يحتوي على أكثر من مستخدم
       Branch.hasMany(models.User, { foreignKey: 'branch_id', as: 'users' });
    }
  }

  Branch.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true, // ✔️ القيمة الافتراضية
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
      modelName: 'Branch',
      tableName: 'branches',
      timestamps: true,
      underscored: true,

    }
  );

  return Branch;
};
