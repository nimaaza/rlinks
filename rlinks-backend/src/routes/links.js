const router = require('express').Router();

const { PAGINATION_LIMIT } = require('../config');
const { setUserMiddleware: setUser, authorizationMiddleware: auth } = require('../helpers/middlewares');
const { Link, User } = require('../db');
const { createPaginationQuery } = require('../helpers/pagination');
const { createErrorObject, externalAuthorizationErrorMessage } = require('../helpers/error');

router.post('/shorten', setUser, async (request, response, next) => {
  const url = request.body.url;
  const username = request.publicUser ? 'public' : request.user.username;

  const shortLink = await Link.transformer(url, username);

  if (shortLink) {
    response.json(shortLink);
  } else {
    next(createErrorObject('Invalid URL!'));
  }
});

router.post('/', setUser, async (request, response) => {
  const { mode, cursor, mine } = request.body;
  let links;

  if (mine && request.user) {
    const username = request.user.username;
    const user = await User.findOne({ where: { username } });
    links = await user.getLinks(createPaginationQuery(mode, cursor));
  } else {
    links = await Link.findAll(createPaginationQuery(mode, cursor));
  }

  links = links.map(link => link.dataValues);
  const hasNext = links.length === PAGINATION_LIMIT;
  response.json({ links, hasNext, cursor: cursor + 1 });
});

router.delete('/:id', auth, async (request, response, next) => {
  const { id } = request.params;
  const link = await Link.findOne({ where: { id } });

  if (!link) {
    const error = createErrorObject(`Link with given ID (${id}) does not exist.`, externalAuthorizationErrorMessage);
    return next(error);
  }

  const user = await link.getUser();

  if (user.username === 'public') {
    const error = createErrorObject(
      'Unauthorized action prohibited: deleting link not belonging to the public user.',
      externalAuthorizationErrorMessage
    );
    return next(error);
  }

  if (user.id !== request.user.id) {
    const error = createErrorObject(
      `Unauthorized action prohibited: deleting link not belonging to user ${request.user.id}.`,
      externalAuthorizationErrorMessage
    );
    return next(error);
  }

  await link.destroy();
  response.json({ message: 'Link deleted.' });
});

module.exports = router;
