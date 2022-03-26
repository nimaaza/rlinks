const express = require('express');
const path = require('path');

const {
  authorizationMiddleware: auth,
  loggerMiddleware: logger,
  errorHandlerMiddleware: errorHandler,
} = require('./helpers/middlewares');
const { PAGINATION_LIMIT, ENV } = require('./config');
const { Link } = require('./db');
const { createPaginationQuery } = require('./helpers/pagination');
const usersRouter = require('./users');
const loginRouter = require('./login');

const app = express();

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());

app.use(auth, logger);

app.use('/users', usersRouter);
app.use('/login', loginRouter);

// the next two routes are for testing purposes
if (['DEV', 'TEST'].includes(ENV)) {
  app.get('/live', (request, response) => {
    response.status(200).send('rlinks is live!');
  });

  app.post('/', (request, response) => {
    response.status(200).json({ url: request.body.url });
  });
}

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/:key', async (request, response) => {
  const shortKey = request.params.key;
  const link = await Link.findOne({ where: { shortKey } });

  if (link) {
    await link.increment({ visits: 1 });
    response.redirect(link.url);
  } else {
    response.sendFile(path.join(__dirname, 'public', 'error.html'));
  }
});

app.post('/shorten', async (request, response) => {
  const url = request.body.url;
  const shortLink = await Link.transformer(url);

  if (shortLink) {
    response.json(shortLink);
  } else {
    response.json({ error: 'Invalid URL!' });
  }
});

app.post('/links', async (request, response) => {
  let { mode, cursor } = request.body;
  cursor = Number(cursor);
  const query = createPaginationQuery(mode, cursor);

  let links = await Link.findAll(query);
  links = links.map(link => link.dataValues);

  const hasNext = links.length === PAGINATION_LIMIT;
  response.json({ links, hasNext, cursor: cursor + 1 });
});

app.get('*', (request, response) => {
  response.sendFile(path.join(__dirname, 'public', 'error.html'));
});

app.use(errorHandler);

module.exports = app;
