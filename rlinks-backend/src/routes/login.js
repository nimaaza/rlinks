const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const { User } = require('../db');
const { createErrorObject, externalAuthorizationErrorMessage } = require('../helpers/error');

router.post('/', async (request, response, next) => {
  const { username, password } = request.body;

  if (username === 'public') {
    const error = createErrorObject('Login with public user attempted.', externalAuthorizationErrorMessage);
    return next(error);
  }

  const user = await User.findOne({ where: { username } });

  if (await credentialsValid(user, password)) {
  } else {
    next(createErrorObject('Invalid username and/or password.'));
  }
});

const credentialsValid = async (user, password) => user && (await bcrypt.compare(password, user.hash));
module.exports = router;
