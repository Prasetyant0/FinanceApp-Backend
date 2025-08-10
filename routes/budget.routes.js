const express = require('express');
const router = express.Router();
const BudgetController = require('../controllers/budget.controller');
const ValidationHelper = require('../src/utils/validation');
const { authAccess } = require('../middleware/auth.middleware');

router.use(authAccess);

router.get('/', BudgetController.getBudgets);
router.post('/', ValidationHelper.validateCreateBudget, BudgetController.createBudget);
router.get('/:id', BudgetController.getBudgetDetail);
router.put('/:id', ValidationHelper.validateCreateBudget, BudgetController.updateBudget);
router.delete('/:id', BudgetController.deleteBudget);

module.exports = router;
