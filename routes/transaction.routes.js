const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authAccess } = require('../middleware/auth.middleware');

router.get('/', authAccess, transactionController.getTransactions);
router.post('/', authAccess, transactionController.createTransaction);
router.get('/dashboard', authAccess, transactionController.getDashboardStats);

module.exports = router;
