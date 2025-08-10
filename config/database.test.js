require('dotenv').config();

module.exports = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME_TEST || 'finance_db_test',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
