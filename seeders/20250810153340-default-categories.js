'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('categories', [
      // Expense categories
      {
        name: 'Makanan & Minuman',
        type: 'expense',
        icon: '🍽️',
        color: '#ef4444',
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Transportasi',
        type: 'expense',
        icon: '🚗',
        color: '#f59e0b',
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Belanja',
        type: 'expense',
        icon: '🛒',
        color: '#ec4899',
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Hiburan',
        type: 'expense',
        icon: '🎬',
        color: '#8b5cf6',
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Tagihan',
        type: 'expense',
        icon: '📄',
        color: '#6366f1',
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Kesehatan',
        type: 'expense',
        icon: '🏥',
        color: '#06b6d4',
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Pendidikan',
        type: 'expense',
        icon: '📚',
        color: '#10b981',
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Lainnya',
        type: 'expense',
        icon: '📦',
        color: '#6b7280',
        is_default: true,
        created_at: now,
        updated_at: now
      },

      // Income categories
      {
        name: 'Gaji',
        type: 'income',
        icon: '💰',
        color: '#10b981',
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Freelance',
        type: 'income',
        icon: '💻',
        color: '#059669',
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Investasi',
        type: 'income',
        icon: '📈',
        color: '#0d9488',
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Bonus',
        type: 'income',
        icon: '🎁',
        color: '#84cc16',
        is_default: true,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Lainnya',
        type: 'income',
        icon: '💵',
        color: '#22c55e',
        is_default: true,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', {
      is_default: true
    });
  }
};
