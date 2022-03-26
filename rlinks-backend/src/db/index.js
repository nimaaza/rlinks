const { Sequelize } = require('sequelize');

const logger = require('../helpers/logger');
const initializeModels = require('./models');
const { ENV, DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD, DB_LOGGER } = require('../config');

logger(`Connecting to PostgreSQL server at ${DB_HOST}:${DB_PORT}`);

const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'postgres',
  port: DB_PORT,
  logging: DB_LOGGER,
  dialectOptions: ENV === 'PROD' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

const { Link, User } = initializeModels(sequelize);

const connect = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: ENV === 'TEST' });
  logger('Connection to database established.');
};

if (['DEV', 'TEST', 'PROD'].includes(ENV)) connect();

module.exports = { sequelize, Link, User };
