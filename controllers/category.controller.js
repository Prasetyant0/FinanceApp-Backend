const db = require('../models');
const { Category } = db;

const defaultCategories = [
  { name: 'Makanan & Minuman', type: 'expense', icon: '🍽️', color: '#ef4444' },
  { name: 'Transportasi', type: 'expense', icon: '🚗', color: '#f59e0b' },
  { name: 'Belanja', type: 'expense', icon: '🛒', color: '#ec4899' },
  { name: 'Hiburan', type: 'expense', icon: '🎬', color: '#8b5cf6' },
  { name: 'Tagihan', type: 'expense', icon: '📄', color: '#6366f1' },
  { name: 'Kesehatan', type: 'expense', icon: '🏥', color: '#06b6d4' },
  { name: 'Pendidikan', type: 'expense', icon: '📚', color: '#10b981' },
  { name: 'Lainnya', type: 'expense', icon: '📦', color: '#6b7280' },

  { name: 'Gaji', type: 'income', icon: '💰', color: '#10b981' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#059669' },
  { name: 'Investasi', type: 'income', icon: '📈', color: '#0d9488' },
  { name: 'Bonus', type: 'income', icon: '🎁', color: '#84cc16' },
  { name: 'Lainnya', type: 'income', icon: '💵', color: '#22c55e' }
];

exports.getCategories = async (req, res) => {
  try {
    const { type } = req.query; // income atau expense

    const whereClause = {};
    if (type && ['income', 'expense'].includes(type)) {
      whereClause.type = type;
    }

    const categories = await Category.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    if (categories.length === 0) {
      await Category.bulkCreate(defaultCategories.map(cat => ({...cat, is_default: true})));

      const newCategories = await Category.findAll({
        where: whereClause,
        order: [['name', 'ASC']]
      });

      return res.status(200).json({
        success: true,
        message: 'Categories retrieved (seeded with defaults)',
        data: newCategories
      });
    }

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either income or expense'
      });
    }

    const category = await Category.create({
      name,
      type,
      icon: icon || '📦',
      color: color || '#6366f1'
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
