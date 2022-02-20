require('dotenv').config();

let URL, PORT;

if (process.env.NODE_ENV === 'DEV') {
  PORT = process.env.PORT;
} else if (process.env.NODE_ENV === 'TEST') {
  PORT = process.env.TEST_PORT;
}

if (['DEV', 'TEST'].includes(process.env.NODE_ENV)) {
  URL = `${process.env.URL}:${PORT}`;
} else {
  URL = process.env.PRODUCTION_URL;
}

let DB_HOST, DB_LOGGER, DB_USERNAME, DB_PASSWORD, DB_NAME;

if (process.env.NODE_ENV === 'DEV') {
  DB_HOST = process.env.DB_DEV_HOST;
  DB_LOGGER = process.env.DB_DEV_DB_LOGGER;
  DB_USERNAME = process.env.DB_DEV_USERNAME;
  DB_PASSWORD = process.env.DB_DEV_PASSWORD;
  DB_NAME = process.env.DB_DEV_NAME;
} else if (process.env.NODE_ENV === 'TEST') {
  DB_HOST = process.env.DB_TEST_HOST;
  DB_LOGGER = process.env.DB_TEST_DB_LOGGER;
  DB_USERNAME = process.env.DB_TEST_USERNAME;
  DB_PASSWORD = process.env.DB_TEST_PASSWORD;
  DB_NAME = process.env.DB_TEST_NAME;
}

module.exports = {
  URL,
  PORT,
  ENV: process.env.NODE_ENV,
  DB_HOST,
  DB_LOGGER,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
};
