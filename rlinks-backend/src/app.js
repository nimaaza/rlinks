const express = require('express');
const path = require('path');

const config = require('../config');
const { Link } = require('./db');
const { createPaginationQuery } = require('./helpers/pagination');

const app = express();

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());

if (['DEV', 'TEST'].includes(config.ENV)) {
  app.get('/live', (request, response) => {
    response.status(200).send('rlinks is live!');
  });

  app.post('/', (request, response) => {
    response.status(200).json({
      url: request.body.url,
    });
  });
}

app.get('/', (request, response) => {
  response.sendFile('/index.html');
});

app.get('/:key', async (request, response) => {
  const shortKey = request.params.key;
  const link = await Link.findOne({ where: { shortKey } });

  if (link) {
    await link.increment({ visits: 1 });
    return response.redirect(link.url);
  } else {
    return response.status(400).json({
      error: 'This URL has not been shortened!',
    });
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

  const hasNext = links.length === config.PAGINATION_LIMIT;
  response.json({ links, hasNext, cursor: cursor + 1 });
});

module.exports = app;
