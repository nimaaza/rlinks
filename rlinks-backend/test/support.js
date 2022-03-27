const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../src/config');
const { sequelize, Link, User } = require('../src/db');

const SAMPLE_USERNAME = 'username';
const SAMPLE_PASSWORD = '12345678';
const SAMPLE_PASSWORD_HASH = bcrypt.hash(SAMPLE_PASSWORD, config.SALT_ROUNDS);

const SAMPLE_SHORT_KEY = 'ABCDEFG';
const SAMPLE_URL = 'https://www.youtube.com/watch?v=LPLKOLJAbds';
const ANOTHER_SAMPLE_URL = 'https://www.youtube.com/';

const doAxiosGet = endpoint => axios.get(`${config.SERVER_URL}/${endpoint}`);

const doAxiosPost = (endpoint, data) => {

const doAxiosPatch = (endpoint, data, headers) => {
  return axios.patch(`${config.SERVER_URL}/${endpoint}`, data, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    validateStatus: () => true,
  });
};

const doAxiosDelete = (endpoint, headers) => {
  return axios.delete(`${config.SERVER_URL}/${endpoint}`, {
    headers: { ...headers },
    validateStatus: () => true,
  });
};

const loginToken = (username, id) => jwt.sign({ username, id }, config.JWT_SECRET);

const clearDataBase = async () => {
  const query = {
    where: {},
  };

  await Link.destroy(query);
  await User.destroy(query);
};

const constants = {
  SAMPLE_USERNAME,
  SAMPLE_PASSWORD,
  SAMPLE_PASSWORD_HASH,
  SAMPLE_SHORT_KEY,
  SAMPLE_URL,
  ANOTHER_SAMPLE_URL,
};

const functions = {
  doAxiosGet,
  doAxiosPost,
  doAxiosPatch,
  doAxiosDelete,
  loginToken,
  clearDataBase,
};

module.exports = { config, Link, User, sequelize, constants, functions };
