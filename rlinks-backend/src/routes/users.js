const router = require('express').Router();

const { User } = require('../db');
const { authorizationMiddleware: auth } = require('../helpers/middlewares');
const passwordHash = require('../helpers/hash');

router.post('/', async (request, response, next) => {
  const { username, password } = request.body;

  if (!username || username.trim().length === 0) {
    const error = createErrorObject('Username missing.');
    return next(error);
  }

  if (!password || password.trim().length === 0) {
    const error = createErrorObject('Password missing.');
    return next(error);
  }

  const existingUser = await User.findOne({ where: { username } });

  if (existingUser) {
    const error = createErrorObject('Username is already taken.');
    return next(error);
  } else {
    const hash = await passwordHash(password);
    const user = await User.create({ username, hash });
    return response.json({ username: user.username });
  }
});

router.patch('/:key', auth, async (request, response, next) => {
  const query = queryGenerator(request.params.key);
  const user = await User.findOne(query);

  if (user.id !== request.user.id) {
    const error = createErrorObject(
      `Unauthorized action prohibited: user with id ${request.user.id} tried changing password for user with id ${user.id}`,
      'Unauthorized access.'
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
      'Unauthorized access.'
    );
    return next(error);
  }

  await user.destroy();
  response.end();
});

// allow both /users/:id and /users/:username to identify the resource
const queryGenerator = param => (Number(param) ? { where: { id: param } } : { where: { username: param } });

const createErrorObject = (serverSideMessage, userSideMessage) => {
  const error = new Error(serverSideMessage);
  error.externalMessage = userSideMessage || serverSideMessage;

  return error;
};

module.exports = router;
