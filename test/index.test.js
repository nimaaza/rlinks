const axios = require('axios');

const config = require('../config');
const server = require('../index');
const { sequelize, Link } = require('../src/db');

const SHORT_KEY = 'ABCDEFG';
const URL = 'https://www.youtube.com/watch?v=LPLKOLJAbds';
const youTubeLink = { url: URL, shortKey: SHORT_KEY };

beforeAll(async () => {
  await sequelize.authenticate();
});

afterAll(async () => {
  await sequelize.close();
  server.close();
});

describe('Test basic backend behaviour', () => {
  test('GET /live responds with rlinks is live', async () => {
    const response = await axios.get(`${config.URL}/live`);
    expect(response.data).toBe('rlinks is live!');
  });

  test('GET / responds with appropriate index.html file', async () => {
    const response = await axios.get(`${config.URL}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.data).toContain(
      '<title>RLinks - link reducer service</title>'
    );
  });

  test('POST / will receive the URL included in the request body', async () => {
    const response = await axios.post(
      `${config.URL}`,
      { url: URL },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const body = response.data;
    expect(body.url).toEqual(URL);
  });
});

describe('Basic tests for the database', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true, match: /-test$/ });
  });

  test('Basic CRUD operations on the Link model work', async () => {
    const createdLink = await Link.create(youTubeLink);
    expect(createdLink.url).toEqual(youTubeLink.url);
    expect(createdLink.shortKey).toEqual(youTubeLink.shortKey);
    expect(createdLink.count).toBe(1);
    expect(createdLink).toHaveProperty('createdAt');
    expect(createdLink).toHaveProperty('updatedAt');
    expect(createdLink).toHaveProperty('id');

    const readLink = await Link.findOne({
      where: { shortKey: youTubeLink.shortKey },
    });
    expect(readLink.url).toEqual(youTubeLink.url);
    expect(readLink.shortKey).toEqual(youTubeLink.shortKey);
    expect(readLink.count).toBe(1);
    expect(readLink).toHaveProperty('createdAt');
    expect(readLink).toHaveProperty('updatedAt');
    expect(readLink).toHaveProperty('id');

    await readLink.update({ shortKey: 'ABCDEFG' });
    await readLink.increment({ count: 1 });
    expect(readLink.shortKey).toEqual('ABCDEFG');
    expect(readLink.count).toBe(2);

    await readLink.destroy();
    const allLinksInDb = await Link.findAll();
    expect(allLinksInDb).toHaveLength(0);
  });
});

describe('Tests for postfix generator for shortened links', () => {
  const { randomAlphaNumbericString } = require('../src/helpers/randomize');
  const randomStringLength = 7;
  const numberOfStringsToCompare = 10000;

  test(`Expect return value to be a string of length ${randomStringLength}`, () => {
    const randomString = randomAlphaNumbericString(randomStringLength);
    expect(typeof randomString).toBe('string');
    expect(randomString).toHaveLength(randomStringLength);
  });

  test(`Expect ${numberOfStringsToCompare} generated strings to have different values`, () => {
    let oldPrefix = randomAlphaNumbericString(randomStringLength);

    for (let i = 0; i < numberOfStringsToCompare; i++) {
      let newPostfix = randomAlphaNumbericString(randomStringLength);
      expect(newPostfix).not.toEqual(oldPrefix);
      oldPrefix = newPostfix;
    }
  });
});

describe('Tests for proper redirection upon visiting a shortened link', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true, match: /-test$/ });
    await Link.create(youTubeLink);
  });

  test(`GET /${SHORT_KEY} receives a redirect response`, async () => {
    const response = await axios.get(`${config.URL}/${SHORT_KEY}`);
    expect(response.request._redirectable._isRedirect).toBe(true);
  });

  test(`GET /${SHORT_KEY} gets redirected to ${URL}`, async () => {
    const response = await axios.get(`${config.URL}/${SHORT_KEY}`);
    expect(response.request._redirectable._currentUrl).toEqual(URL);
  });

  test(`GET /${SHORT_KEY.toLowerCase()} receives a 400 status code with appropriate error message`, async () => {
    try {
      await axios.get(`${config.URL}/${SHORT_KEY.toLowerCase()}`);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('error');
      expect(error.response.data.error).toContain(
        'This URL has not been shortened!'
      );
    }
  });
});

describe('Tests for the transformer of links to short links', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true, match: /-test$/ });
    await Link.create(youTubeLink);
  });

  test('Should return falsy for an invalid URL', async () => {
    expect(await Link.transformer('invalid_url')).toBeFalsy();
  });

  test(`Should return ${SHORT_KEY} for existing ${URL} incrementing its count`, async () => {
    const responseBefore = await Link.findOne({ where: { url: URL } });
    await Link.transformer(URL);
    const responseAfter = await Link.findOne({ where: { url: URL } });

    expect(responseAfter.shortKey).toEqual(responseBefore.shortKey);
    expect(responseAfter.count).toEqual(responseBefore.count + 1);
  });

  test('Should return a new key for a valid URL not existing in the database', async () => {
    const response = await Link.transformer('https://www.google.com/');
    const shortKey = response.shortKey;

    expect(typeof shortKey).toEqual('string');
    expect(shortKey).toHaveLength(7);
  });
});
