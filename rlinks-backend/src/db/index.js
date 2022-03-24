const { Sequelize } = require('sequelize');

const { ENV, DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD, DB_LOGGER } = require('../config');

const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'postgres',
  logging: DB_LOGGER,
  dialectOptions: ENV === 'PROD' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

const { Link, User } = initializeModels(sequelize);

const connect = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: ENV === 'TEST' });
};

if (['DEV', 'TEST', 'PROD'].includes(ENV)) connect();

module.exports = { sequelize, Link, User };
