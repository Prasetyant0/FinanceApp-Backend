const db = require('../models');
const { Category } = db;
const ResponseHelper = require('../src/utils/response');
const { HTTP_STATUS, RESPONSE_MESSAGES } = require('../src/constants/response');

const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Makanan & Minuman', type: 'expense', icon: '🍽️', color: '#ef4444' },
  { name: 'Transportasi', type: 'expense', icon: '🚗', color: '#f59e0b' },
  { name: 'Belanja', type: 'expense', icon: '🛒', color: '#ec4899' },
  { name: 'Hiburan', type: 'expense', icon: '🎬', color: '#8b5cf6' },
  { name: 'Tagihan', type: 'expense', icon: '📄', color: '#6366f1' },
  { name: 'Kesehatan', type: 'expense', icon: '🏥', color: '#06b6d4' },
  { name: 'Pendidikan', type: 'expense', icon: '📚', color: '#10b981' },
  { name: 'Lainnya', type: 'expense', icon: '📦', color: '#6b7280' },

  // Income categories
  { name: 'Gaji', type: 'income', icon: '💰', color: '#10b981' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#059669' },
  { name: 'Investasi', type: 'income', icon: '📈', color: '#0d9488' },
  { name: 'Bonus', type: 'income', icon: '🎁', color: '#84cc16' },
  { name: 'Lainnya', type: 'income', icon: '💵', color: '#22c55e' }
];

class CategoryController {
  static async getCategories(req, res) {
    try {
      const { type } = req.query;
      const whereClause = CategoryController.buildWhereClause({ type });

      let categories = await Category.findAll({
        where: whereClause,
        order: [['name', 'ASC']]
      });

      // Seed default categories if none exist
      if (categories.length === 0) {
        categories = await CategoryController.seedDefaultCategories(whereClause);
      }

      return ResponseHelper.success(
        res,
        categories,
        'Categories retrieved successfully'
      );
    } catch (error) {
      console.error('Get categories error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async createCategory(req, res) {
    try {
      const { name, type, icon, color } = req.body;

      // Validate type
      if (!CategoryController.isValidCategoryType(type)) {
        return ResponseHelper.error(
          res,
          'Type must be either income or expense',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const categoryData = {
        name,
        type,
        icon: icon || '📦',
        color: color || '#6366f1'
      };

      const category = await Category.create(categoryData);

      return ResponseHelper.success(
        res,
        category,
        RESPONSE_MESSAGES.SUCCESS.CREATED,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Create category error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, type, icon, color } = req.body;

      const category = await Category.findByPk(id);
      if (!category) {
        return ResponseHelper.error(
          res,
          RESPONSE_MESSAGES.ERROR.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Validate type if provided
      if (type && !CategoryController.isValidCategoryType(type)) {
        return ResponseHelper.error(
          res,
          'Type must be either income or expense',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (type) updateData.type = type;
      if (icon) updateData.icon = icon;
      if (color) updateData.color = color;

      const updatedCategory = await category.update(updateData);

      return ResponseHelper.success(
        res,
        updatedCategory,
        RESPONSE_MESSAGES.SUCCESS.UPDATED
      );
    } catch (error) {
      console.error('Update category error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Category.destroy({
        where: { id, is_default: false }
      });

      if (!deleted) {
        return ResponseHelper.error(
          res,
          'Category not found or cannot delete default category',
          HTTP_STATUS.NOT_FOUND
        );
      }

      return ResponseHelper.success(
        res,
        null,
        RESPONSE_MESSAGES.SUCCESS.DELETED
      );
    } catch (error) {
      console.error('Delete category error:', error);
      return ResponseHelper.error(res);
    }
  }

  // Helper methods
  static buildWhereClause(filters) {
    const whereClause = {};
    if (filters.type && ['income', 'expense'].includes(filters.type)) {
      whereClause.type = filters.type;
    }
    return whereClause;
  }

  static isValidCategoryType(type) {
    return ['income', 'expense'].includes(type);
  }

  static async seedDefaultCategories(whereClause) {
    await Category.bulkCreate(
      DEFAULT_CATEGORIES.map(cat => ({ ...cat, is_default: true }))
    );

    return await Category.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });
  }
}

// Export methods untuk backward compatibility
module.exports = {
  getCategories: CategoryController.getCategories,
  createCategory: CategoryController.createCategory,
  updateCategory: CategoryController.updateCategory,
  deleteCategory: CategoryController.deleteCategory
};
