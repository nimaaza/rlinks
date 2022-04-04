const { sequelize, User } = require('./src/db');

const { ENV } = require('./src/config');

const clear = async () => {
  await sequelize.authenticate();
  await sequelize.drop();
  await sequelize.sync();
  await User.create({ username: 'public', hash: '' });
  await sequelize.close();
};

if (ENV === 'SEED') clear();
