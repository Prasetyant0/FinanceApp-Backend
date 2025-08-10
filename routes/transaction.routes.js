const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transaction.controller');
const ValidationHelper = require('../src/utils/validation');
const { authAccess } = require('../middleware/auth.middleware');

router.use(authAccess);

router.get('/dashboard', TransactionController.getDashboardStats);

router.get('/', ValidationHelper.validatePagination, TransactionController.getTransactions);
router.post('/', ValidationHelper.validateCreateTransaction, TransactionController.createTransaction);
router.get('/:id', TransactionController.getTransactionDetail);
router.put('/:id', ValidationHelper.validateCreateTransaction, TransactionController.updateTransaction);
router.delete('/:id', TransactionController.deleteTransaction);

module.exports = router;
