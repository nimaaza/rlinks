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

afterAll(async () => {
  await sequelize.drop({ match: /-test$/ });
  await sequelize.close();
  server.close();
});
