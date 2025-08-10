'use strict';
const bcrypt = require('bcrypt');
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    avatar_url: { type: DataTypes.STRING(255), allowNull: true },
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    scopes: {
      // pastikan password disertakan eksplisit ketika butuh
      withPassword: {
        attributes: { include: ['password'] }
      }
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
      },
      beforeUpdate: async (user) => {
        if (user.changed && user.changed('password')) user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
      }
    }
  });

  User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.associate = function (models) {
    User.hasMany(models.Transaction, {
      foreignKey: 'user_id',
      as: 'transactions'
    });

    User.hasMany(models.Budget, {
      foreignKey: 'user_id',
      as: 'budgets'
    });
  };

  return User;
};
