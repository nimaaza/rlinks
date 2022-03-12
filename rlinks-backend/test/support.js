const axios = require('axios');

const config = require('../src/config');
const { Link, sequelize } = require('../src/db');

const SAMPLE_SHORT_KEY = 'ABCDEFG';
const SAMPLE_URL = 'https://www.youtube.com/watch?v=LPLKOLJAbds';
const ANOTHER_SAMPLE_URL = 'https://www.youtube.com/';

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

const constants = {
  SAMPLE_SHORT_KEY,
  SAMPLE_URL,
  ANOTHER_SAMPLE_URL,
};

const functions = {
  doAxiosGet,
  doAxiosPost,
  clearDataBase,
};

module.exports = { config, Link, sequelize, constants, functions };
