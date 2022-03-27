const express = require('express');

const { User } = require('../db');
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

router.patch('/:id', async (request, response) => {
  const hash = await passwordHash(request.body.password);
  const where = queryCondition(request.params.id);
  await User.update({ hash }, where);
});

router.delete('/:id', async (request, response) => {
  const where = queryCondition(request.params.id);
  await User.destroy(where);
});

const queryCondition = param => {
  let clause;

  if (Number(param)) {
    clause = { where: { id: param } };
  } else {
    clause = { where: { username: param } };
  }

  return clause;
};

module.exports = router;
