const router = require('express').Router();

const { PAGINATION_LIMIT } = require('../config');
const { Link } = require('../db');
const { createPaginationQuery } = require('../helpers/pagination');

router.post('/shorten', async (request, response, next) => {
  const url = request.body.url;
  const shortLink = await Link.transformer(url);

  if (shortLink) {
    response.json(shortLink);
  } else {
    const error = new Error('Invalid URL!');
    error.externalMessage = 'Invalid URL!';
    next(error);
  }
});

router.post('/', async (request, response) => {
  let { mode, cursor } = request.body;
  cursor = Number(cursor);
  const query = createPaginationQuery(mode, cursor);

  let links = await Link.findAll(query);
  links = links.map(link => link.dataValues);

  const hasNext = links.length === PAGINATION_LIMIT;
  response.json({ links, hasNext, cursor: cursor + 1 });
});

module.exports = router;
