'use strict';

module.exports = (sequelize, DataTypes) => {
  const Reminder = sequelize.define('Reminder', {
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reminder_type: {
      type: DataTypes.ENUM('budget_check', 'recurring_transaction', 'bill_payment', 'custom'),
      allowNull: false
    },
    frequency: {
      type: DataTypes.ENUM('once', 'daily', 'weekly', 'monthly'),
      defaultValue: 'once'
    },
    remind_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    next_reminder: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'reminders',
    underscored: true,
    timestamps: true
  });

  Reminder.associate = function(models) {
    Reminder.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Reminder;
};
