require('dotenv').config();

let URL;

if (['DEV', 'TEST'].includes(process.env.NODE_ENV)) {
  URL = `${process.env.URL}:${process.env.PORT}`;
} else {
  URL = process.env.PRODUCTION_URL;
}

module.exports = {
  URL,
  PORT: process.env.PORT,
  ENV: process.env.NODE_ENV,
};
