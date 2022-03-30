const router = require('express').Router();

const { User } = require('../db');
const { authorizationMiddleware: auth } = require('../helpers/middlewares');
const passwordHash = require('../helpers/hash');

router.post('/', async (request, response, next) => {
  const { username, password } = request.body;
  const existingUser = await User.findOne({ where: { username } });

  if (existingUser) {
    const error = new Error('Username is already taken.');
    error.externalMessage = 'Username is already taken.';
    next(error);
  } else {
    const hash = await passwordHash(password);
    const user = await User.create({ username, hash });
    response.json({ username: user.username });
  }
});

router.patch('/:key', auth, async (request, response) => {
  const query = queryGenerator(request.params.key);
  const user = await User.findOne(query);
  const hash = await passwordHash(request.body.password);
  await user.update({ hash });
  response.json({ username: user.username });
});

router.delete('/:key', auth, async (request, response) => {
  const query = queryGenerator(request.params.key);
  await User.destroy(query);
  response.end();
});

// allow both /users/:id and /users/:username to identify the resource
const queryGenerator = param => (Number(param) ? { where: { id: param } } : { where: { username: param } });

module.exports = router;
