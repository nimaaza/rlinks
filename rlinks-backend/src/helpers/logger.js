/* eslint-disable no-console */
const { ENV } = require('../config');

const logger = (info, error) => {
  if (ENV === 'TEST') return;

  console.log('----------------------------------------');

  if (info) console.info(info);
  if (error) console.error('🠊 ', error);
};

module.exports = logger;
