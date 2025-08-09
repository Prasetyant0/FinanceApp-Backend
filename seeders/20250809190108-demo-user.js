'use strict';
const bcrypt = require('bcrypt');
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [{
      name: 'Admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('password123', SALT_ROUNDS),
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
