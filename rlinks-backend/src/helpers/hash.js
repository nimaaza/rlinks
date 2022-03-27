const bcrypt = require('bcrypt');

const { SALT_ROUNDS } = require('../config');

const passwordHash = async password => {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  return hash;
};

module.exports = passwordHash;
