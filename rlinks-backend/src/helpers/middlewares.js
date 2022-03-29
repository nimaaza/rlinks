const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const { User } = require('../db');
const logger = require('./logger');

const externalAuthorizationErrorMessage = 'Unauthorized access.';

const authorizationMiddleware = async (request, response, next) => {
  const authorization = request.get('authorization');

  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    try {
      const { username, id } = jwt.verify(authorization.substring(7), JWT_SECRET);

      if (username && id) {
        const user = await User.findOne({ where: { username, id } });

        if (user) {
          request.authenticateId = id => id === user.id;
          request.authenticateUsername = username => username === user.username;
        }
      }
    } catch (error) {
      error.externalMessage = externalAuthorizationErrorMessage;
      next(error);
    }
  } else {
    request.authenticateId = () => false;
    request.authenticateUsername = () => false;
  }

  next();
};

const authenticateMiddleware = (request, response, next) => {
  let { key, id, username } = request.params;

  if (key) {
    id = Number(key);
    username = key;
  } else {
    id = Number(id);
  }

  if ((id && request.authenticateId(id)) || (username && request.authenticateUsername(username))) {
    next();
  } else {
    const error = new Error();
    error.externalMessage = externalAuthorizationErrorMessage;
    next(error);
  }
};

const loggerMiddleware = (request, response, next) => {
  const { method, hostname, ip, originalUrl, params, body } = request;

  let message = `${method} ${originalUrl} from ${hostname} at ${ip}`;

  if (Object.keys(params).length > 0) {
    message = `${message}\n  ↳ params: ${JSON.stringify(params)}`;
  }

  if (Object.keys(body).length > 0) {
    message = `${message}\n  ↳ body: ${JSON.stringify(body)}`;
  }

  logger(message);

  next();
};

const errorHandlerMiddleware = (error, request, response, next) => {
  logger(null, error.message);
  response.json({ error: error.externalMessage });
  next();
};

module.exports = { authorizationMiddleware, authenticateMiddleware, loggerMiddleware, errorHandlerMiddleware };
