'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users LIMIT 1;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log('No users found, skipping transaction seeder');
      return;
    }

    const userId = users[0].id;

    const categories = await queryInterface.sequelize.query(
      'SELECT id, type FROM categories WHERE is_default = true;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (categories.length === 0) {
      console.log('No categories found, skipping transaction seeder');
      return;
    }

    const now = new Date();
    const transactions = [];

    // Sample transactions untuk bulan ini
    for (let i = 0; i < 10; i++) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomDate = new Date(now.getFullYear(), now.getMonth(), Math.floor(Math.random() * 28) + 1);

      transactions.push({
        user_id: userId,
        category_id: randomCategory.id,
        type: randomCategory.type,
        amount: randomCategory.type === 'income'
          ? Math.floor(Math.random() * 5000000) + 1000000
          : Math.floor(Math.random() * 500000) + 10000,
        description: `Sample ${randomCategory.type} transaction ${i + 1}`,
        transaction_date: randomDate,
        created_at: now,
        updated_at: now
      });
    }

    await queryInterface.bulkInsert('transactions', transactions);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('transactions', {
      description: {
        [Sequelize.Op.like]: 'Sample%'
      }
    });
  }
};
