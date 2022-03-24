require('dotenv').config();

const ENV = process.env.NODE_ENV;

if (!['DEV', 'SEED', 'TEST', 'PROD'].includes(ENV)) {
  throw new Error('Undefine environment!');
}

let SERVER_URL, PORT;

if (['DEV', 'SEED', 'PROD'].includes(ENV)) {
  PORT = process.env.PORT;
} else if (ENV === 'TEST') {
  PORT = process.env.TEST_PORT;
}

if (['DEV', 'SEED', 'TEST'].includes(ENV)) {
  SERVER_URL = `${process.env.DEVELOPMENT_URL}:${PORT}`;
} else if (ENV === 'PROD') {
  SERVER_URL = process.env.PRODUCTION_URL;
}

let DB_HOST, DB_LOGGER, DB_USERNAME, DB_PASSWORD, DB_NAME;

if (ENV === 'DEV' || ENV === 'SEED') {
  // when seeding, the development database is used
  DB_HOST = process.env.DB_DEV_HOST;
  DB_LOGGER = false;
  DB_USERNAME = process.env.DB_DEV_USERNAME;
  DB_PASSWORD = process.env.DB_DEV_PASSWORD;
  DB_NAME = process.env.DB_DEV_NAME;
} else if (ENV === 'TEST') {
  DB_HOST = process.env.DB_TEST_HOST;
  DB_LOGGER = false;
  DB_USERNAME = process.env.DB_TEST_USERNAME;
  DB_PASSWORD = process.env.DB_TEST_PASSWORD;
  DB_NAME = process.env.DB_TEST_NAME;
} else if (ENV === 'PROD') {
  DB_HOST = process.env.DB_PROD_HOST;
  DB_LOGGER = false;
  DB_USERNAME = process.env.DB_PROD_USERNAME;
  DB_PASSWORD = process.env.DB_PROD_PASSWORD;
  DB_NAME = process.env.DB_PROD_NAME;
}

const DB_PORT = process.env.DB_PORT || 5432;

const PAGINATION_LIMIT = ['DEV', 'TEST'].includes(ENV) ? 5 : 10;
const SHORT_KEY_LENGTH = 7;
const PAGINATION_MODE = {
  CREATED_AT: 'id',
  COUNT: 'count',
  VISITS: 'visits',
};

module.exports = {
  ENV,
  PORT,
  SERVER_URL,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_LOGGER,
  SHORT_KEY_LENGTH,
  PAGINATION_LIMIT,
  PAGINATION_MODE,
};
