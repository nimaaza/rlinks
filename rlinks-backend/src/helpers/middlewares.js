const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const { User } = require('../db');
const logger = require('./logger');

const authorizationMiddleware = async (request, response, next) => {
  const authorization = request.get('authorization');

  if (authorization) {
    try {
      const { username, id } = jwt.verify(authorization.substring(7), JWT_SECRET);

      if (username && id) {
        const user = await User.findOne({ where: { username, id } });

        if (user) {
          request.authorizedUsername = user.username;
          request.authorizedId = user.id;
        }
      }
    } catch (err) {
      next(err);
    }
  }

  next();
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
  response.status(400).end();
  next();
};

module.exports = { authorizationMiddleware, loggerMiddleware, errorHandlerMiddleware };
