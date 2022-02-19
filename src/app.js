const express = require('express');
const path = require('path');

const config = require('../config');

const app = express();

app.use(express.static(path.join(__dirname, '/public')));

if (['DEV', 'TEST'].includes(config.ENV)) {
  app.get('/live', (request, response) => {
    response.status(200).send('rlinks is live!');
  });
}

app.get('/', (request, response) => {
  response.sendFile('/index.html');
});

module.exports = app;
