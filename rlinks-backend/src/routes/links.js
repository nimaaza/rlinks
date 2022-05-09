const router = require('express').Router();

const { PAGINATION_LIMIT } = require('../config');
const { setUserMiddleware: setUser, authorizationMiddleware: auth } = require('../helpers/middlewares');
const { Link, User } = require('../db');
const { createPaginationQuery } = require('../helpers/pagination');
const { createErrorObject, externalAuthorizationErrorMessage } = require('../helpers/error');

router.post('/shorten', setUser, async (request, response, next) => {
  const username = request.publicUser ? 'public' : request.user.username;

  const shortLink = await Link.transformer(request.body.url, username);

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
  const { link, error } = await authorizeUser(request.params.linkId, request.user);

  if (error) {
    next(error);
  } else {
    await link.destroy();
    response.json({ message: 'Link deleted.' });
  }
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

const authorizeUser = async (linkId, requestingUser) => {
  let error;
  const link = await Link.findOne({ where: { id: linkId } });

  if (!link) {
    error = createErrorObject(`Link with given ID (${linkId}) does not exist.`, externalAuthorizationErrorMessage);
    return { error };
  }

  const user = await link.getUser();

  if (user.username === 'public') {
    error = createErrorObject(
      'Unauthorized action prohibited: deleting link belonging to the public user.',
      externalAuthorizationErrorMessage
    );
  } else if (user.id !== requestingUser.id) {
    error = createErrorObject(
      `Unauthorized action prohibited: deleting link not belonging to user ${requestingUser.id}.`,
      externalAuthorizationErrorMessage
    );
  }

  return { link, error };
};

module.exports = router;
