const config = require('./config');
const app = require('./src/app');

const server = app.listen(config.PORT, () =>
  console.log(`server listening on port ${process.env.PORT}`)
);

if (config.ENV === 'TEST') {
  module.exports = server;
}
