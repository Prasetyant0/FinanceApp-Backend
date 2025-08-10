const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/category.controller');
const ValidationHelper = require('../src/utils/validation');
const { authAccess } = require('../middleware/auth.middleware');

router.use(authAccess);

router.get('/', CategoryController.getCategories);
router.post('/', ValidationHelper.validateCreateCategory, CategoryController.createCategory);
router.put('/:id', ValidationHelper.validateCreateCategory, CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

module.exports = router;
