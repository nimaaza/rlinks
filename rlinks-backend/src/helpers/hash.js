const bcrypt = require('bcrypt');

const passwordHash = async password => {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  return hash;
};

module.exports = passwordHash;
