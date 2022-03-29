const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const { User } = require('../db');
const logger = require('./logger');

const authorizationError = new Error('Unauthorized access.');

const authorizationMiddleware = async (request, response, next) => {
  const authorization = request.get('authorization');

  if (authorization) {
    try {
      const { username, id } = jwt.verify(authorization.substring(7), JWT_SECRET);

      if (username && id) {
        const user = await User.findOne({ where: { username, id } });

        if (user) {
          request.authenticateId = id => id === user.id;
          request.authenticateUsername = username => username === user.username;
        }
      }
    } catch (err) {
      next(authorizationError);
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
    next(authorizationError);
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
  response.json({ error: error.message }).end();
  next();
};

module.exports = { authorizationMiddleware, authenticateMiddleware, loggerMiddleware, errorHandlerMiddleware };
