const ReportService = require('../src/services/report.service');
const ResponseHelper = require('../src/utils/response');
const { HTTP_STATUS, RESPONSE_MESSAGES } = require('../src/constants/response');

class ReportController {
  static async getFinancialSummary(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'month', year, month } = req.query;

      if (!['week', 'month', 'year', 'custom'].includes(period)) {
        return ResponseHelper.error(
          res,
          'Period must be week, month, year, or custom',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const summary = await ReportService.getFinancialSummary(
        userId,
        period,
        year ? parseInt(year) : null,
        month ? parseInt(month) : null
      );

      return ResponseHelper.success(
        res,
        summary,
        'Financial summary retrieved successfully'
      );
    } catch (error) {
      console.error('Get financial summary error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async getTrendAnalysis(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'monthly', limit = 12 } = req.query;

      if (!['weekly', 'monthly'].includes(period)) {
        return ResponseHelper.error(
          res,
          'Period must be weekly or monthly',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const trends = await ReportService.getTrendAnalysis(
        userId,
        period,
        parseInt(limit)
      );

      return ResponseHelper.success(
        res,
        trends,
        'Trend analysis retrieved successfully'
      );
    } catch (error) {
      console.error('Get trend analysis error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async getTopCategories(req, res) {
    try {
      const userId = req.user.id;
      const {
        type = 'expense',
        period = 'month',
        limit = 10
      } = req.query;

      if (!['income', 'expense'].includes(type)) {
        return ResponseHelper.error(
          res,
          'Type must be income or expense',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const topCategories = await ReportService.getTopCategories(
        userId,
        type,
        period,
        parseInt(limit)
      );

      return ResponseHelper.success(
        res,
        topCategories,
        `Top ${type} categories retrieved successfully`
      );
    } catch (error) {
      console.error('Get top categories error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async getBudgetProgress(req, res) {
    try {
      const userId = req.user.id;
      const budgetProgress = await ReportService.getBudgetProgress(userId);

      return ResponseHelper.success(
        res,
        budgetProgress,
        'Budget progress retrieved successfully'
      );
    } catch (error) {
      console.error('Get budget progress error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async getInsights(req, res) {
    try {
      const userId = req.user.id;

      const [summary, trends, budgetProgress] = await Promise.all([
        ReportService.getFinancialSummary(userId, 'month'),
        ReportService.getTrendAnalysis(userId, 'monthly', 3),
        ReportService.getBudgetProgress(userId)
      ]);

      const insights = ReportController.generateInsights(summary, trends, budgetProgress);

      return ResponseHelper.success(
        res,
        {
          summary,
          recent_trends: trends.trends.slice(-3),
          budget_alerts: budgetProgress.filter(b => b.progress.status === 'warning' || b.progress.status === 'over_budget'),
          insights
        },
        'Financial insights retrieved successfully'
      );
    } catch (error) {
      console.error('Get insights error:', error);
      return ResponseHelper.error(res);
    }
  }

  // Helper method untuk generate insights
  static generateInsights(summary, trends, budgetProgress) {
    const insights = [];

    // Budget insights
    const overBudgetCount = budgetProgress.filter(b => b.progress.is_over_budget).length;
    const warningBudgetCount = budgetProgress.filter(b => b.progress.status === 'warning').length;

    if (overBudgetCount > 0) {
      insights.push({
        type: 'warning',
        title: 'Budget Terlampaui',
        message: `Anda memiliki ${overBudgetCount} kategori yang melebihi budget`,
        action: 'review_budget'
      });
    }

    if (warningBudgetCount > 0) {
      insights.push({
        type: 'info',
        title: 'Mendekati Batas Budget',
        message: `${warningBudgetCount} kategori mendekati batas budget`,
        action: 'monitor_spending'
      });
    }

    // Trend insights
    if (trends.analysis) {
      const expenseChange = parseFloat(trends.analysis.expense_trend.change_percentage);

      if (expenseChange > 20) {
        insights.push({
          type: 'warning',
          title: 'Pengeluaran Meningkat',
          message: `Pengeluaran naik ${expenseChange.toFixed(1)}% dari bulan lalu`,
          action: 'analyze_expenses'
        });
      } else if (expenseChange < -10) {
        insights.push({
          type: 'success',
          title: 'Pengeluaran Menurun',
          message: `Bagus! Pengeluaran turun ${Math.abs(expenseChange).toFixed(1)}% dari bulan lalu`,
          action: 'maintain_discipline'
        });
      }
    }

    // Balance insights
    if (summary.summary.net_balance < 0) {
      insights.push({
        type: 'danger',
        title: 'Pengeluaran > Pemasukan',
        message: 'Pengeluaran Anda lebih besar dari pemasukan bulan ini',
        action: 'reduce_expenses'
      });
    } else if (summary.summary.net_balance > summary.summary.total_income * 0.2) {
      insights.push({
        type: 'success',
        title: 'Saving Rate Bagus',
        message: 'Anda berhasil menyisihkan lebih dari 20% income',
        action: 'consider_investment'
      });
    }

    return insights;
  }
}

module.exports = ReportController;
