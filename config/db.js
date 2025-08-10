require("dotenv").config();
const { Sequelize } = require("sequelize");

const isTest = process.env.NODE_ENV === 'test';

const sequelize = new Sequelize(
    isTest ? process.env.DB_NAME_TEST : process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: isTest ? false : console.log,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;
