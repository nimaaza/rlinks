const express = require('express');
const path = require('path');

const { loggerMiddleware: logger, errorHandlerMiddleware: errorHandler } = require('./helpers/middlewares');
const { ENV } = require('./config');
const { Link } = require('./db');
const usersRouter = require('./routes/users');
const loginRouter = require('./routes/login');
const linksRouter = require('./routes/links');

const errorPage = path.join(__dirname, 'public', 'error.html');

const app = express();

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());

app.use(logger);

app.use('/users', usersRouter);
app.use('/login', loginRouter);
app.use('/links', linksRouter);

if (ENV === 'TEST') {
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
  const link = await Link.findOne({
    where: {
      shortKey: request.params.key,
    },
  });

  if (link) {
    await link.increment({ visits: 1 });
    response.redirect(link.url);
  } else {
    response.sendFile(errorPage);
  }
});

app.get('*', (request, response) => {
  response.sendFile(errorPage);
});

app.use(errorHandler);

module.exports = app;
