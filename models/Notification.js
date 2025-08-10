'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('budget_alert', 'budget_exceeded', 'reminder', 'goal_achieved', 'system'),
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    action_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    underscored: true,
    timestamps: true
  });

  Notification.associate = function(models) {
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Notification;
};
