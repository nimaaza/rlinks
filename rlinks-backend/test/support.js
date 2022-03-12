const axios = require('axios');

const config = require('../src/config');
const { Link, sequelize } = require('../src/db');

const SAMPLE_URL = 'https://www.youtube.com/watch?v=LPLKOLJAbds';

const doAxiosGet = endpoint => axios.get(`${config.SERVER_URL}/${endpoint}`);

const doAxiosPost = (endpoint, data) => {
  return axios.post(`${config.SERVER_URL}/${endpoint}`, data, { headers: { 'Content-Type': 'application/json' } });
};

const clearDataBase = async () => {
  await Link.destroy({
    where: {},
    truncate: true,
  });
};

  SAMPLE_URL,
const functions = {
  doAxiosGet,
  doAxiosPost,
  clearDataBase,
};

const constants = {
  SHORT_KEY,
  URL,
  youTubeLink,
  TEST_URL,
};

module.exports = { config, Link, sequelize, functions, constants };
