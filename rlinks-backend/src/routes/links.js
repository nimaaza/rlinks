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
  const links = await fetchLinks({ ...request.body, ...request.user });
  const hasNext = links.length === PAGINATION_LIMIT;
  const cursor = request.body.cursor + 1;

  response.json({ links, hasNext, cursor });
});

router.delete('/:linkId', auth, async (request, response, next) => {
  const { linkId } = request.params;
  const link = await Link.findOne({ where: { id: linkId } });

  if (!link) {
    const error = createErrorObject(
      `Link with given ID (${linkId}) does not exist.`,
      externalAuthorizationErrorMessage
    );
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

const fetchLinks = async ({ mode, cursor, mine, username }) => {
  let links;

  if (mine && username) {
    const user = await User.findOne({ where: { username } });
    links = await user.getLinks(createPaginationQuery(mode, cursor));
  } else {
    links = await Link.findAll(createPaginationQuery(mode, cursor));
  }

  return links.map(link => link.dataValues);
};

module.exports = router;
