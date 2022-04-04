const { sequelize, Link, User } = require('./src/db');
const { ENV } = require('./src/config');

const urls = require('./data');

const clear = async () => {
  await sequelize.authenticate();
  await sequelize.drop();
  await sequelize.sync();
  await User.create({ username: 'public', hash: '' });
};

const seed = async () => {
  await clear();

  urls.forEach(async url => {
    await Link.transformer(url, 'public');
  });
};

if (ENV === 'SEED') {
  seed();
}
