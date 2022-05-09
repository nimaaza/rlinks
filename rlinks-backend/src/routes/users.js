const router = require('express').Router();

const { User } = require('../db');
const { authorizationMiddleware: auth } = require('../helpers/middlewares');
const generateHash = require('../helpers/hash');
const { createErrorObject, externalAuthorizationErrorMessage } = require('../helpers/error');

router.post('/', async (request, response, next) => {
  const { username, password } = request.body;

  const validationError = await validateUserData(request.body);
  if (validationError) return next(validationError);

  const hash = await generateHash(password);
  const user = await User.create({ username, hash });
  return response.json({ username: user.username });
});

router.patch('/:key', auth, async (request, response, next) => {
  const { user, error } = await authorizeUser(request.params.key, request.user);

  if (error) {
    next(error);
  } else {
    const hash = await generateHash(request.body.password);
    await user.update({ hash });
    response.json({ username: user.username });
  }
});

router.delete('/:key', auth, async (request, response, next) => {
  const { user, error } = await authorizeUser(request.params.key, request.user);

  if (error) {
    next(error);
  } else {
    await user.destroy();
    response.end();
  }
});

const validateUserData = async (username, password) => {
  if (!username || username.trim().length === 0) return createErrorObject('Username missing.');
  if (!password || password.trim().length === 0) return createErrorObject('Password missing.');

  const userExists = await User.findOne({ where: { username } });
  if (userExists) return createErrorObject('Username is already taken.');
};

const authorizeUser = async (userIdentifierKey, requestingUser) => {
  const internalAuthorizationErrorMessage = `Unauthorized action by user with id ${requestingUser.id} prohibited.`;
  const user = await User.findOne(queryGenerator(userIdentifierKey));
  let error;

  if (user.id !== requestingUser.id) {
    error = createErrorObject(internalAuthorizationErrorMessage, externalAuthorizationErrorMessage);
  }

  return { user, error };
};

// allow both /users/:id and /users/:username paths to identify the user resource
const queryGenerator = key => (Number(key) ? { where: { id: key } } : { where: { username: key } });

module.exports = router;
