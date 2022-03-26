const server = require('../src/index');
const { sequelize } = require('./support');

require('./app.test');
require('./config.test');
require('./db/index.test');
require('./helpers/index.test');
require('./routes/index.test');

afterAll(async () => {
  await sequelize.close();
  server.close();
});
