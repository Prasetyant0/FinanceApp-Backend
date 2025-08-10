'use strict';

module.exports = (sequelize, DataTypes) => {
  const Budget = sequelize.define('Budget', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    period: {
      type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
      allowNull: false,
      defaultValue: 'monthly'
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    alert_threshold: {
      type: DataTypes.INTEGER,
      defaultValue: 80,
      validate: {
        min: 1,
        max: 100
      }
    }
  }, {
    tableName: 'budgets',
    underscored: true,
    timestamps: true
  });

  Budget.associate = function(models) {
    Budget.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    Budget.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });
  };

  return Budget;
};
