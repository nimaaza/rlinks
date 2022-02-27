const axios = require('axios');

const config = require('../config');
const server = require('../index');
const { sequelize, Link } = require('../src/db');

const SHORT_KEY = 'ABCDEFG';
const URL = 'https://www.youtube.com/watch?v=LPLKOLJAbds';
const youTubeLink = { url: URL, shortKey: SHORT_KEY };

const doAxiosPost = (endpoint, data) => {
  return axios.post(`${config.URL}/${endpoint}`, data, {
    headers: { 'Content-Type': 'application/json' },
  });
};

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

describe('Tests for the transforming of links to short links', () => {
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

describe('Tests for end-point at /shorten for shortening links', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true, match: /-test$/ });
    await Link.create(youTubeLink);
  });

  test('POST /shorten will result in an error message for an invalid URL', async () => {
    const response = await doAxiosPost('shorten', { url: 'invalid_link' });
    expect(response.data).toEqual({ error: 'Invalid URL!' });
  });

  test('POST /shorten with https://www.google.com in request body will response with a valid short key', async () => {
    const response = await doAxiosPost('shorten', {
      url: 'https://www.google.com',
    });
    expect(typeof response.data.shortKey).toEqual('string');
    expect(response.data.shortKey).toHaveLength(7);
    expect(response.data.count).toBe(1);
  });

  test(`POST /shorten with ${URL} in request body will response with ${SHORT_KEY} and number of times link is created`, async () => {
    const response = await doAxiosPost('shorten', { url: URL });
    expect(response.data.shortKey).toEqual(SHORT_KEY);
    expect(response.data.count).toBe(2);
  });
});

describe('Tests for the end-point at /links for the pagination of produced short links', () => {
  const limit = config.PAGINATION_LIMIT;
  const sampleUrls = [
    'https://sequelize.org/v6/manual/model-querying-basics.html#limits-and-pagination',
    'https://sequelize.org/',
    'https://www.dw.com/en/top-stories/s-9097',
    'https://join.com/companies/dot9/3960834-working-student-m-f-d-software-development',
    'https://keep.google.com/',
    'https://www.jetbrains.com/',
    'https://fullstackopen.com/en/part5/testing_react_apps',
    'https://github.com/nimaaza/rlinks',
    'https://press.princeton.edu/books/paperback/9780691160887/addiction-by-design',
    'https://testing-library.com/docs/react-testing-library/intro/',
    'https://martinfowler.com/articles/practical-test-pyramid.html',
    'https://kentcdodds.com/blog/how-to-add-testing-to-an-existing-project',
    'https://www.albertgao.xyz/2017/05/24/how-to-test-expressjs-with-jest-and-supertest/',
    'https://docs.cypress.io/guides/core-concepts/introduction-to-cypress#Cypress-Can-Be-Simple-Sometimes',
    'https://www.w3.org/International/questions/qa-personal-names.en',
    'https://support.microsoft.com/en-us/office/database-design-basics-eb2159cf-1e30-401a-8084-bd4f9c9ca1f5',
    'https://ezdxf.readthedocs.io/en/stable/usage_for_beginners.html#arch-usr',
    'https://doc.rust-lang.org/stable/book/',
    'https://talks.osfc.io/osfc2021/talk/JTWYEH/',
    'https://docs.docker.com/get-started/07_multi_container/',
    'https://iep.utm.edu/truth/',
    'https://www.youtube.com/watch?v=2Oe6HUgrRlQ',
    'https://react-bootstrap.github.io/forms/select/',
  ];

  const paginationRequests = Math.floor(sampleUrls.length / limit);

  beforeEach(async () => {
    const { randomAlphaNumbericString } = require('../src/helpers/randomize');

    await sequelize.sync({ force: true, match: /-test$/ });

    sampleUrls.forEach(async url => {
      const shortKey = randomAlphaNumbericString(7);
      const data = { url, shortKey };
      await Link.create(data);
    });
  });

  test('The request to the end-point with no ID should return the first page of links', async () => {
    const firstResponse = await doAxiosPost('links', {});

    expect(firstResponse.data).toHaveProperty('links');
    expect(firstResponse.data.links).toHaveLength(limit);
  });

  test(`Should return an array of links of size ${limit} and a boolean with a large enough ID provided`, async () => {
    const data = { id: sampleUrls.length + 10 };
    const response = await doAxiosPost('links', data);

    expect(response.data).toHaveProperty('links');
    expect(response.data.links).toHaveLength(limit);
    expect(response.data).toHaveProperty('hasNext');
    expect(response.data).toHaveProperty('after');
  });

  test(`On the first ${paginationRequests} pagination requests, hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false`, async () => {
    const firstPaginationRequest = await doAxiosPost('links', {});
    expect(firstPaginationRequest.data.hasNext).toBe(true);
    let id = firstPaginationRequest.data.after;

    for (let i = 1; i < paginationRequests; i++) {
      const nextPaginationRequest = await doAxiosPost('links', { id });
      expect(nextPaginationRequest.data.hasNext).toBe(true);
      id = nextPaginationRequest.data.after;
    }

    const lastPaginationRequest = await doAxiosPost('links', { id });
    expect(lastPaginationRequest.data.hasNext).toBe(false);
    expect(lastPaginationRequest.data.links.length).toBeLessThan(limit);
  });
});
