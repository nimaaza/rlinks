require('dotenv').config();

const ENV = process.env.NODE_ENV;
let URL, PORT;

if (ENV === 'DEV' || ENV === 'PROD') {
  PORT = process.env.PORT;
} else if (ENV === 'TEST') {
  PORT = process.env.TEST_PORT;
}

if (['DEV', 'TEST'].includes(ENV)) {
  URL = `${process.env.URL}:${PORT}`;
} else {
  URL = process.env.PRODUCTION_URL;
}

let DB_HOST, DB_LOGGER, DB_USERNAME, DB_PASSWORD, DB_NAME;

if (ENV === 'DEV' || ENV === 'SEED') {
  // when seeding, the development database is used
  DB_HOST = process.env.DB_DEV_HOST;
  DB_LOGGER = process.env.DB_DEV_DB_LOGGER;
  DB_USERNAME = process.env.DB_DEV_USERNAME;
  DB_PASSWORD = process.env.DB_DEV_PASSWORD;
  DB_NAME = process.env.DB_DEV_NAME;
} else if (ENV === 'TEST') {
  DB_HOST = process.env.DB_TEST_HOST;
  DB_LOGGER = process.env.DB_TEST_DB_LOGGER;
  DB_USERNAME = process.env.DB_TEST_USERNAME;
  DB_PASSWORD = process.env.DB_TEST_PASSWORD;
  DB_NAME = process.env.DB_TEST_NAME;
} else if (ENV === 'PROD') {
  DB_HOST = process.env.DB_PROD_HOST;
  DB_LOGGER = process.env.DB_PROD_DB_LOGGER;
  DB_USERNAME = process.env.DB_PROD_USERNAME;
  DB_PASSWORD = process.env.DB_PROD_PASSWORD;
  DB_NAME = process.env.DB_PROD_NAME;
}

const PAGINATION_LIMIT = ['DEV', 'TEST'].includes(ENV) ? 5 : 10;
const SHORT_KEY_LENGTH = 7;
const PAGINATION_MODE = {
  CREATED_AT: 'id',
  COUNT: 'count',
  VISITS: 'visits',
};

module.exports = {
  URL,
  PORT,
  ENV,
  DB_HOST,
  DB_LOGGER,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
  SHORT_KEY_LENGTH,
  PAGINATION_LIMIT,
  PAGINATION_MODE,
};
