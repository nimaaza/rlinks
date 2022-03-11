const axios = require('axios');

const config = require('../src/config');
const { Link, sequelize } = require('../src/db');

const SHORT_KEY = 'ABCDEFG';
const URL = 'https://www.youtube.com/watch?v=LPLKOLJAbds';
const youTubeLink = { url: URL, shortKey: SHORT_KEY };
const TEST_URL = 'https://www.youtube.com/';

const doAxiosGet = endpoint => axios.get(`${config.URL}/${endpoint}`);

const doAxiosPost = (endpoint, data) => {
  return axios.post(`${config.URL}/${endpoint}`, data, { headers: { 'Content-Type': 'application/json' } });
};

const clearDataBase = async () => {
  await Link.destroy({
    where: {},
    truncate: true,
  });
};

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
