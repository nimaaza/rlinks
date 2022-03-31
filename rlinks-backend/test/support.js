const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../src/config');
const { sequelize, Link, User } = require('../src/db');

const SAMPLE_USERNAME = 'username1';
const SAMPLE_PASSWORD = '123456789';
const SAMPLE_PASSWORD_HASH = bcrypt.hash(SAMPLE_PASSWORD, config.SALT_ROUNDS);
const ANOTHER_SAMPLE_USERNAME = 'username2';
const ANOTHER_SAMPLE_PASSWORD = '987654321';
const ANOTHER_SAMPLE_PASSWORD_HASH = bcrypt.hash(ANOTHER_SAMPLE_PASSWORD, config.SALT_ROUNDS);

const SAMPLE_SHORT_KEY = 'ABCDEFG';
const SAMPLE_URL = 'https://www.youtube.com/watch?v=LPLKOLJAbds';
const ANOTHER_SAMPLE_URL = 'https://www.youtube.com/';

const doAxiosGet = endpoint => axios.get(httpLink(endpoint), { validateStatus: () => true });

const doAxiosPost = (endpoint, data, headers) => {
  return axios.post(httpLink(endpoint), data, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    validateStatus: () => true,
  });
};

const doAxiosPatch = (endpoint, data, headers) => {
  return axios.patch(httpLink(endpoint), data, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    validateStatus: () => true,
  });
};

const doAxiosDelete = (endpoint, headers) => {
  return axios.delete(httpLink(endpoint), {
    headers: { ...headers },
    validateStatus: () => true,
  });
};

const httpLink = endpoint =>
  endpoint.startsWith('/') ? `${config.SERVER_URL}${endpoint}` : `${config.SERVER_URL}/${endpoint}`;

const loginToken = (username, id) => jwt.sign({ username, id }, config.JWT_SECRET);

const clearDataBase = async () => {
  const query = {
    where: {},
  };

  await Link.destroy(query);
  await User.destroy(query);
  await User.create({ username: 'public', hash: '' });
};

const constants = {
  SAMPLE_USERNAME,
  SAMPLE_PASSWORD,
  SAMPLE_PASSWORD_HASH,
  ANOTHER_SAMPLE_USERNAME,
  ANOTHER_SAMPLE_PASSWORD,
  ANOTHER_SAMPLE_PASSWORD_HASH,
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
