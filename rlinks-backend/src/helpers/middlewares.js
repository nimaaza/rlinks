const logger = require('./logger');

const loggerMiddleware = (request, response, next) => {
  const { method, hostname, ip, originalUrl, params, body } = request;

  let message = `${method} ${originalUrl} from ${hostname} at ${ip}`;

  if (Object.keys(params).length > 0) {
    message = `${message}\n ↳ params: ${JSON.stringify(params)}`;
  }

  if (Object.keys(body).length > 0) {
    message = `${message}\n ↳ body: ${JSON.stringify(body)}`;
  }

  logger(message);

  next();
};

const errorHandlerMiddleware = (error, request, response, next) => {
  logger(null, error.message);
  next(error);
};

module.exports = { loggerMiddleware, errorHandlerMiddleware };
