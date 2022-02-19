const config = require('../config');
const express = require('express');

const app = express();

if (['DEV', 'TEST'].includes(config.ENV)) {
  app.get('/live', (request, response) => {
    response.status(200).send('rlinks is live!');
  });
}

module.exports = app;
