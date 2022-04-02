const router = require('express').Router();

const { PAGINATION_LIMIT } = require('../config');
const { setUserMiddleware: setUser } = require('../helpers/middlewares');
const { Link, User } = require('../db');
const { createPaginationQuery } = require('../helpers/pagination');

router.post('/shorten', setUser, async (request, response, next) => {
  const url = request.body.url;
  const username = request.publicUser ? 'public' : request.user.username;

  const shortLink = await Link.transformer(url, username);

  if (shortLink) {
    response.json(shortLink);
  } else {
    const error = new Error('Invalid URL!');
    error.externalMessage = 'Invalid URL!';
    next(error);
  }
});

router.post('/', setUser, async (request, response) => {
  const { mode, cursor, mine } = request.body;
  const query = createPaginationQuery(mode, cursor);

  let links;

  if (mine && request.user) {
    const username = request.user.username;
    const user = await User.findOne({ where: { username } });
    links = await user.getLinks(query);
  } else {
    links = await Link.findAll(query);
  }

  links = links.map(link => link.dataValues);

  const hasNext = links.length === PAGINATION_LIMIT;
  response.json({ links, hasNext, cursor: cursor + 1 });
});

module.exports = router;
