const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const logger = require('./logger');

const externalAuthorizationErrorMessage = 'Unauthorized access.';

const authorizationMiddleware = (request, response, next) => {
  const authorization = request.get('authorization');

  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    const token = authorization.substring(7);
    try {
      const { username, id } = jwt.verify(token, JWT_SECRET);
      if (username && id) {
        request.user = { username, id };
        next();
      } else {
        const error = new Error('Invalid token: missing user data.');
        error.externalMessage = externalAuthorizationErrorMessage;
        next(error);
      }
    } catch (error) {
      error.externalMessage = externalAuthorizationErrorMessage;
      next(error);
    }
  } else {
    const error = new Error('Invalid or no token.');
    error.externalMessage = externalAuthorizationErrorMessage;
    next(error);
  }
};

const loggerMiddleware = (request, response, next) => {
  const { method, hostname, ip, originalUrl, params, body } = request;

  let message = `${method} ${originalUrl} from ${hostname} at ${ip}`;

  if (Object.keys(params).length > 0) {
    message = `${message}\n    ↳ params: ${JSON.stringify(params)}`;
  }

  if (Object.keys(body).length > 0) {
    message = `${message}\n    ↳ body: ${JSON.stringify(body)}`;
  }

  logger(message);

  next();
};

const errorHandlerMiddleware = (error, request, response, next) => {
  if (error.message) {
    logger(null, error.message);
  }

  response.json({ error: error.externalMessage });
  next();
};

module.exports = { authorizationMiddleware, loggerMiddleware, errorHandlerMiddleware };
