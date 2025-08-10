const db = require('../models');
const { Transaction, Category } = db;
const { Op } = require('sequelize');

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      type,
      category_id,
      start_date,
      end_date
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { user_id: userId };

    // Filter by type
    if (type && ['income', 'expense'].includes(type)) {
      whereClause.type = type;
    }

    // Filter by category
    if (category_id) {
      whereClause.category_id = category_id;
    }

    // Filter by date range
    if (start_date && end_date) {
      whereClause.transaction_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      order: [['transaction_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      category_id,
      type,
      amount,
      description,
      transaction_date
    } = req.body;

    if (!category_id || !type || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Category, type, and amount are required'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either income or expense'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (category.type !== type) {
      return res.status(400).json({
        success: false,
        message: `Category type (${category.type}) doesn't match transaction type (${type})`
      });
    }

    const transaction = await Transaction.create({
      user_id: userId,
      category_id,
      type,
      amount,
      description: description || null,
      transaction_date: transaction_date || new Date()
    });

    const newTransaction = await Transaction.findByPk(transaction.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: newTransaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query; // month, week, year

    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        endDate = new Date(now.setDate(startDate.getDate() + 6));
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const whereClause = {
      user_id: userId,
      transaction_date: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Total income dan expense
    const income = await Transaction.sum('amount', {
      where: { ...whereClause, type: 'income' }
    }) || 0;

    const expense = await Transaction.sum('amount', {
      where: { ...whereClause, type: 'expense' }
    }) || 0;

    // Recent transactions (5 terakhir)
    const recentTransactions = await Transaction.findAll({
      where: { user_id: userId },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      order: [['transaction_date', 'DESC']],
      limit: 5
    });

    // Expense by category
    const expensesByCategory = await Transaction.findAll({
      where: { ...whereClause, type: 'expense' },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      attributes: [
        'category_id',
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total']
      ],
      group: ['category_id', 'category.id'],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('amount')), 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        period,
        summary: {
          income: parseFloat(income),
          expense: parseFloat(expense),
          balance: parseFloat(income - expense)
        },
        recentTransactions,
        expensesByCategory: expensesByCategory.map(item => ({
          category: item.category,
          total: parseFloat(item.dataValues.total)
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
