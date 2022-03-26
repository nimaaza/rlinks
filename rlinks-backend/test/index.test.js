const server = require('../src/index');
const { sequelize } = require('../src/db');

require('./basics.test');
require('./link.test');
require('./utils.test');
require('./generation.test');
require('./redirection.test');
require('./pagination.test');

afterAll(async () => {
  await sequelize.close();
  server.close();
});
