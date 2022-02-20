const axios = require('axios');

const config = require('../config');
const server = require('../index');
const { sequelize, Link } = require('../src/db');

const SHORT_KEY = 'ABCDEFG';
const LINK = 'https://www.youtube.com/watch?v=LPLKOLJAbds';

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ match: /-test$/ });
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
      { url: LINK },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const body = response.data;
    expect(body.url).toEqual(LINK);
  });
});

describe('Basic tests for the database', () => {
  test('Basic CRUD operations on the Link model work', async () => {
    const link = {
      url: LINK,
      shortKey: 'AbCdEFG',
    };

    const createdLink = await Link.create(link);
    expect(createdLink.url).toEqual(link.url);
    expect(createdLink.shortKey).toEqual(link.shortKey);
    expect(createdLink.count).toBe(1);
    expect(createdLink).toHaveProperty('createdAt');
    expect(createdLink).toHaveProperty('updatedAt');
    expect(createdLink).toHaveProperty('id');

    const readLink = await Link.findOne({ where: { shortKey: link.shortKey } });
    expect(readLink.url).toEqual(link.url);
    expect(readLink.shortKey).toEqual(link.shortKey);
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
  let randomString;

  beforeEach(() => {
    randomString = randomAlphaNumbericString(randomStringLength);
  });

  test(`Expect return value to be a string of length ${randomStringLength}`, () => {
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
  beforeAll(async () => {
    const link = { url: LINK, shortKey: SHORT_KEY };
    await Link.create(link);
  });

  test(`GET /${SHORT_KEY} receives a redirect response`, async () => {
    const response = await axios.get(`${config.URL}/${SHORT_KEY}`);
    expect(response.request._redirectable._isRedirect).toBe(true);
  });

  test(`GET /${SHORT_KEY} gets redirected to ${LINK}`, async () => {
    const response = await axios.get(`${config.URL}/${SHORT_KEY}`);
    expect(response.request._redirectable._currentUrl).toEqual(LINK);
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
  let count;

  beforeAll(async () => {
    const response = await Link.findOne({ where: { url: LINK } });
    count = response.count;
  });

  test('Should return falsy for an invalid URL', async () => {
    expect(await Link.transformer('invalid_url')).toBeFalsy();
  });

  test(`Should return ${SHORT_KEY} for existing ${LINK}`, async () => {
    expect(await Link.transformer(LINK)).toEqual(SHORT_KEY);
  });

  test('Should increment count when URL has already been shortened', async () => {
    const response = await Link.findOne({ where: { url: LINK } });
    expect(response.count).toBe(count + 1);
  });

  test('Should return a new key for a valid URL not existing in the database', async () => {
    const key = await Link.transformer('https://www.google.com/');
    expect(typeof key).toEqual('string');
    expect(key).toHaveLength(7);
  });
});

afterAll(async () => {
  await sequelize.drop({ match: /-test$/ });
  await sequelize.close();
  server.close();
});
