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
  const checked = user && (await bcrypt.compare(password, user.hash));

  if (checked) {
    const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET);
    response.status(200).json({ token, username: user.username });
  } else {
    const error = createErrorObject('Invalid username and/or password.');
    next(error);
  }
});

module.exports = router;
