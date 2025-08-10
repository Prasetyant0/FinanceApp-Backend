require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('API berjalan 🚀'));

const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const transactionRoutes = require('./routes/transaction.routes');
const budgetRoutes = require('./routes/budget.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const reminderRoutes = require('./routes/reminder.routes');

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reminders', reminderRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
  sequelize
    .sync({ alter: true })
    .then(() => {
      console.log('✅ Database synced');
      const port = process.env.PORT || 5000;
      app.listen(port, () =>
        console.log(`🚀 Server berjalan di port ${port}`)
      );
    })
    .catch(err => {
      console.error('❌ DB error:', err);
      process.exit(1);
    });
}

module.exports = app;

