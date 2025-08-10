const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/report.controller');
const ValidationHelper = require('../src/utils/validation');
const { authAccess } = require('../middleware/auth.middleware');

router.use(authAccess);

router.get('/summary', ReportController.getFinancialSummary);
router.get('/trends', ReportController.getTrendAnalysis);
router.get('/top-categories', ReportController.getTopCategories);
router.get('/budget-progress', ReportController.getBudgetProgress);
router.get('/insights', ReportController.getInsights);

module.exports = router;
