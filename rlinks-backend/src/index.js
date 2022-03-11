const { PORT } = require('./config');
const app = require('./app');

const server = app.listen(config.PORT, () =>
  console.log(`server listening on port ${process.env.PORT}`)
);

  module.exports = server;
