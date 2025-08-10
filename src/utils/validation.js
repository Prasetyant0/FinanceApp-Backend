const { body, query, param, validationResult } = require('express-validator');
const ResponseHelper = require('./response');
const { HTTP_STATUS, RESPONSE_MESSAGES } = require('../constants/response');

class ValidationHelper {
  static handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseHelper.error(
        res,
        RESPONSE_MESSAGES.ERROR.VALIDATION,
        HTTP_STATUS.BAD_REQUEST,
        errors.array()
      );
    }
    next();
  };

  // Auth validation rules
  static validateRegister = [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    this.handleValidationErrors
  ];

  static validateLogin = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    this.handleValidationErrors
  ];

  static validateRefreshToken = [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    this.handleValidationErrors
  ];

  // Category validation rules
  static validateCreateCategory = [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Category name is required (max 100 chars)'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('icon').optional().isLength({ max: 50 }).withMessage('Icon too long'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be valid hex color'),
    this.handleValidationErrors
  ];

  // Budget validation rules
  static validateCreateBudget = [
    body('category_id').isInt({ min: 1 }).withMessage('Valid category ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('period').isIn(['monthly', 'weekly', 'yearly']).withMessage('Period must be monthly, weekly, or yearly'),
    body('start_date').isISO8601().withMessage('Valid start date is required'),
    body('alert_threshold').optional().isInt({ min: 1, max: 100 }).withMessage('Alert threshold must be between 1-100'),
    this.handleValidationErrors
  ];

  // Transaction validation rules
  static validateCreateTransaction = [
    body('category_id').isInt({ min: 1 }).withMessage('Valid category ID is required'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
    body('transaction_date').optional().isISO8601().withMessage('Invalid date format'),
    this.handleValidationErrors
  ];

  // Query validation
  static validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    this.handleValidationErrors
  ];

  // Param validation
  static validateIdParam = [
    param('id').isInt({ min: 1 }).withMessage('Valid ID is required'),
    this.handleValidationErrors
  ];
}

module.exports = ValidationHelper;
