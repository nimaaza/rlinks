const express = require('express');

const { User } = require('../db');
const { authorizeMiddleware: authorize } = require('../helpers/middlewares');
const passwordHash = require('../helpers/hash');

const router = express.Router();

router.post('/', async (request, response) => {
  const { username, password } = request.body;
  const existingUser = await User.findOne({ where: { username } });

  if (existingUser) {
    response.json({ error: 'Username is already taken.' });
  } else {
    const hash = await passwordHash(password);
    const user = await User.create({ username, hash });
    response.json({ username: user.username });
  }
});

router.patch('/:key', authorize, async (request, response) => {
  const query = queryGenerator(request.params.key);
  const user = await User.findOne(query);
  const hash = await passwordHash(request.body.password);
  await user.update({ hash });
  response.json({ username: user.username });
});

router.delete('/:key', authorize, async (request, response) => {
  const query = queryGenerator(request.params.key);
  await User.destroy(query);
  response.end();
});

// allow both /users/:id and /users/:username to identify the resource
const queryGenerator = param => {
  let whereClause;

  if (Number(param)) {
    whereClause = { where: { id: param } };
  } else {
    whereClause = { where: { username: param } };
  }

  return whereClause;
};

module.exports = router;
