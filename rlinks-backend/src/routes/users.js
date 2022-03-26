const express = require('express');

const { User } = require('../db');
const passwordHash = require('../helpers/hash');

const router = express.Router();

router.post('/', async (request, response, next) => {
  const { username, password } = request.body;
  const hash = await passwordHash(password);

  try {
    const user = await User.create({ username, hash });
    response.json({ username: user.username });
  } catch (err) {
    next(err);
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