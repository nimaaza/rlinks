const { sequelize, Link } = require('./src/db');
const { ENV } = require('./src/config');

const urls = require('./data');

const clear = async () => {
  await sequelize.authenticate();
  await sequelize.drop();
  await sequelize.sync();
};

const seed = async () => {
  await clear();

  urls.forEach(async url => {
    await Link.transformer(url);
  });
};

if (ENV === 'SEED') {
  seed();
}
