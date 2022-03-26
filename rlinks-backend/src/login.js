const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('./config');
const { User } = require('./db');

router.post('/', async (request, response) => {
  const { username, password } = request.body;

  const user = await User.findOne({ where: { username } });
  const checked = user && (await bcrypt.compare(password, user.hash));

  if (checked) {
    const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET);
    response.status(200).json({ token, username: user.username });
  } else {
    response.status(401).json({ error: 'invalid username and/or password' });
  }
});

module.exports = router;
