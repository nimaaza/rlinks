const config = require('./config');

const app = require('./src/app');

app.listen(config.PORT, () =>
  console.log(`server listening on port ${process.env.PORT}`)
);
