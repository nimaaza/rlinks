const { sequelize, initDB } = require('./src/db');
const config = require('./src/config');

const clear = async () => {
  try {
    await initDB();
    await sequelize.sync({ force: true });
    await sequelize.close();
  } catch (error) {
    console.error(error.message);
  }
};

if (config.ENV === 'DEV') {
  clear();
}
