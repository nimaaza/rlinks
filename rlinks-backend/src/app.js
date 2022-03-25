const express = require('express');
const path = require('path');

const { PAGINATION_LIMIT, ENV } = require('./config');
const { Link } = require('./db');
const { createPaginationQuery } = require('./helpers/pagination');
const { loggerMiddleware: logger, errorHandlerMiddleware: errorHandler } = require('./helpers/middlewares');
const usersRouter = require('./users');

const app = express();

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());

app.use('/users', logger, usersRouter);

// the next two routes are for testing purposes
if (['DEV', 'TEST'].includes(ENV)) {
  app.get('/live', logger, (request, response) => {
    response.status(200).send('rlinks is live!');
  });

  app.post('/', logger, (request, response) => {
    response.status(200).json({ url: request.body.url });
  });
}

app.get('/', logger, (request, response) => {
  response.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/:key', logger, async (request, response) => {
  const shortKey = request.params.key;
  const link = await Link.findOne({ where: { shortKey } });

  if (link) {
    await link.increment({ visits: 1 });
    response.redirect(link.url);
  } else {
    response.sendFile(path.join(__dirname, 'public', 'error.html'));
  }
});

app.post('/shorten', logger, async (request, response) => {
  const url = request.body.url;
  const shortLink = await Link.transformer(url);

  if (shortLink) {
    response.json(shortLink);
  } else {
    response.json({ error: 'Invalid URL!' });
  }
});

app.post('/links', logger, async (request, response) => {
  let { mode, cursor } = request.body;
  cursor = Number(cursor);
  const query = createPaginationQuery(mode, cursor);

  let links = await Link.findAll(query);
  links = links.map(link => link.dataValues);

  const hasNext = links.length === PAGINATION_LIMIT;
  response.json({ links, hasNext, cursor: cursor + 1 });
});

app.use(errorHandler);

module.exports = app;
