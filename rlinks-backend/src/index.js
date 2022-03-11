const { PORT } = require('./config');
const app = require('./app');
const logger = require('./helpers/logger');

const server = app.listen(PORT, () => logger(`server listening on port ${PORT}`));

module.exports = server;
