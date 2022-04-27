const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const logger = require('./logger');
const { createErrorObject, externalAuthorizationErrorMessage } = require('./error');

const authorizationMiddleware = (request, response, next) => {
  try {
    const { user, error } = verifyToke(request.get('authorization'));

    if (user) {
      request.user = user;
      next();
    } else if (error) {
      next(error);
    }
  } catch (error) {
    error.externalMessage = externalAuthorizationErrorMessage;
    next(error);
  }
};

const setUserMiddleware = (request, response, next) => {
  try {
    const { user, error } = verifyToke(request.get('authorization'));

    if (user) {
      request.user = user;
      next();
    } else if (error && error.externalMessage.startsWith('Invalid token')) {
      next(error);
    } else {
      request.publicUser = true;
      next();
    }
  } catch (error) {
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

const verifyToke = authorization => {
  const result = {};

  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    const token = authorization.substring(7);
    const { username, id } = jwt.verify(token, JWT_SECRET);
    if (username && id) {
      result.user = { username, id };
    } else {
      result.error = createErrorObject(
        `Invalid token: missing data (${id ? 'username is missing' : 'user id is missing'}).`,
        externalAuthorizationErrorMessage
      );
    }
  } else {
    result.error = createErrorObject('Token is missing.', externalAuthorizationErrorMessage);
  }

  return result;
};

module.exports = { authorizationMiddleware, setUserMiddleware, loggerMiddleware, errorHandlerMiddleware };
