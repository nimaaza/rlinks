const express = require('express');
const path = require('path');

const {
  loggerMiddleware: logger,
  errorHandlerMiddleware: errorHandler,
} = require('./helpers/middlewares');
const { ENV } = require('./config');
const { Link } = require('./db');
const usersRouter = require('./routes/users');
const loginRouter = require('./routes/login');
const linksRouter = require('./routes/links');

const app = express();

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());

app.use(logger);

app.use('/users', usersRouter);
app.use('/login', loginRouter);
app.use('/links', linksRouter);

// the next two routes are for testing purposes
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
  const shortKey = request.params.key;
  const link = await Link.findOne({ where: { shortKey } });

  if (link) {
    await link.increment({ visits: 1 });
    response.redirect(link.url);
  } else {
    response.sendFile(path.join(__dirname, 'public', 'error.html'));
  }
});

app.get('*', (request, response) => {
  response.sendFile(path.join(__dirname, 'public', 'error.html'));
});

app.use(errorHandler);

module.exports = app;
