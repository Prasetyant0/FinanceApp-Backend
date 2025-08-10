const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authAccess } = require('../middleware/auth.middleware');

router.get('/', authAccess, categoryController.getCategories);
router.post('/', authAccess, categoryController.createCategory);

module.exports = router;
