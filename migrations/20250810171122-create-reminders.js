'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('reminders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reminder_type: {
        type: Sequelize.ENUM('budget_check', 'recurring_transaction', 'bill_payment', 'custom'),
        allowNull: false
      },
      frequency: {
        type: Sequelize.ENUM('once', 'daily', 'weekly', 'monthly'),
        defaultValue: 'once'
      },
      remind_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      next_reminder: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional data like amount, category_id, etc'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('reminders', ['user_id']);
    await queryInterface.addIndex('reminders', ['reminder_type']);
    await queryInterface.addIndex('reminders', ['remind_at']);
    await queryInterface.addIndex('reminders', ['next_reminder']);
    await queryInterface.addIndex('reminders', ['is_active']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('reminders');
  }
};
