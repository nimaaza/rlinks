const router = require('express').Router();

const { User } = require('../db');
const { authorizationMiddleware: auth } = require('../helpers/middlewares');
const passwordHash = require('../helpers/hash');
const { createErrorObject, externalAuthorizationErrorMessage } = require('../helpers/error');

router.post('/', async (request, response, next) => {
  const { username, password } = request.body;

  const validationError = await validateUserData(username, password);
  if (validationError) return next(validationError);

  const hash = await passwordHash(password);
  const user = await User.create({ username, hash });
  return response.json({ username: user.username });
});

router.patch('/:key', auth, async (request, response, next) => {
  const query = queryGenerator(request.params.key);
  const user = await User.findOne(query);

  if (user.id !== request.user.id) {
    const error = createErrorObject(
      `Unauthorized action prohibited: user with id ${request.user.id} tried changing password for user with id ${user.id}`,
      externalAuthorizationErrorMessage
    );
    return next(error);
  }

  const hash = await passwordHash(request.body.password);
  await user.update({ hash });
  response.json({ username: user.username });
});

router.delete('/:key', auth, async (request, response, next) => {
  const query = queryGenerator(request.params.key);
  const user = await User.findOne(query);

  if (user.id !== request.user.id) {
    const error = createErrorObject(
      `Unauthorized action prohibited: user with id ${request.user.id} tried deleting user with id ${user.id}`,
      externalAuthorizationErrorMessage
    );
    return next(error);
  }

  await user.destroy();
  response.end();
});

const validateUserData = async (username, password) => {
  if (!username || username.trim().length === 0) return createErrorObject('Username missing.');
  if (!password || password.trim().length === 0) return createErrorObject('Password missing.');

  const existingUser = await User.findOne({ where: { username } });

  if (existingUser) return createErrorObject('Username is already taken.');
};

// allow both /users/:id and /users/:username to identify the resource
const queryGenerator = param => (Number(param) ? { where: { id: param } } : { where: { username: param } });

module.exports = router;
