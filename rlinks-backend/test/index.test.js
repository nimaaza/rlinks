const axios = require('axios');

const config = require('../src/config');
const server = require('../src/index');
const { Link, sequelize } = require('../src/db');

const SHORT_KEY = 'ABCDEFG';
const URL = 'https://www.youtube.com/watch?v=LPLKOLJAbds';
const youTubeLink = { url: URL, shortKey: SHORT_KEY };

const doAxiosPost = (endpoint, data) => {
  return axios.post(`${config.URL}/${endpoint}`, data, {
    headers: { 'Content-Type': 'application/json' },
  });
};

const clearDB = async () => {
  await Link.destroy({
    where: {},
    truncate: true,
  });
};

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
    expect(response.data).toContain('<title>RLinks - link reducer service</title>');
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
    await clearDB();
  });

  const checkReturnedLink = link => {
    expect(link.url).toEqual(youTubeLink.url);
    expect(link.shortKey).toEqual(youTubeLink.shortKey);
    expect(link.count).toBe(1);
    expect(link.visits).toBe(0);
    expect(link).toHaveProperty('title');
    expect(link).toHaveProperty('description');
    expect(link).toHaveProperty('image');
    expect(link).toHaveProperty('createdAt');
    expect(link).toHaveProperty('updatedAt');
    expect(link).toHaveProperty('id');
  };

  test('Basic CRUD operations on the Link model work', async () => {
    const createdLink = await Link.create(youTubeLink);
    checkReturnedLink(createdLink);

    const readLink = await Link.findOne({
      where: { shortKey: youTubeLink.shortKey },
    });
    checkReturnedLink(readLink);

    await readLink.destroy();
    const allLinksInDb = await Link.findAll();
    expect(allLinksInDb).toHaveLength(0);
  });
});

describe('Tests for postfix generator for shortened links', () => {
  const { randomAlphaNumbericString } = require('../src/helpers/randomize');
  const randomStringLength = config.SHORT_KEY_LENGTH;
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
  const numberOfPastVisits = 3;

  beforeEach(async () => {
    await clearDB();
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

  test(`GET /${SHORT_KEY.toLowerCase()} must be redirected to the error page with a link to the app`, async () => {
    const response = await axios.get(`${config.URL}/${SHORT_KEY.toLowerCase()}`);
    expect(response.data).toContain('<a href="/">');
  });

  test('Number of times a link is visited must be recorded correctly', async () => {
    for (let i = 0; i < numberOfPastVisits; i++) {
      await axios.get(`${config.URL}/${SHORT_KEY}`);
    }

    const link = await Link.findOne({
      where: { shortKey: SHORT_KEY },
    });

    expect(link.visits).toBe(numberOfPastVisits);
  });
});

describe('Tests for the transforming of links to short links', () => {
  const { getLinkPreviewData } = require('../src/helpers/previews');
  const { validUrl } = require('../src/helpers/url');
  const testUrl = 'https://www.youtube.com/';
  let previewData;

  beforeEach(async () => {
    await clearDB();
    await Link.create(youTubeLink);
    previewData = await getLinkPreviewData(testUrl);
  });

  test('URL validator must return true for valid URLs, otherwise false', () => {
    expect(validUrl(testUrl)).toBe(true);
    expect(validUrl('invalid_url')).toBe(false);
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

  test('Should return required meta data and a new key for a valid URL not existing in the database', async () => {
    const response = await Link.transformer(testUrl);

    expect(typeof response.shortKey).toEqual('string');
    expect(response.shortKey).toHaveLength(config.SHORT_KEY_LENGTH);
    expect(response.title).toEqual(previewData.title);
    expect(response.description).toEqual(previewData.description);
    expect(response.image).toEqual(previewData.image);
  });
});

describe('Tests for end-point at /shorten for shortening links', () => {
  const testUrl = 'https://www.youtube.com/';

  beforeEach(async () => {
    await clearDB();
    await Link.create(youTubeLink);
  });

  test('POST /shorten will result in an error message for an invalid URL', async () => {
    const response = await doAxiosPost('shorten', { url: 'invalid_link' });
    expect(response.data).toEqual({ error: 'Invalid URL!' });
  });

  test(`POST /shorten with ${testUrl} will response with a valid short key`, async () => {
    const response = await doAxiosPost('shorten', {
      url: testUrl,
    });
    expect(typeof response.data.shortKey).toEqual('string');
    expect(response.data.shortKey).toHaveLength(7);
    expect(response.data.count).toBe(1);
    expect(response.data.visits).toBe(0);
  });

  test(`POST /shorten with ${URL} will respond with ${SHORT_KEY} and the correct number of times its creation is requested`, async () => {
    const response = await doAxiosPost('shorten', { url: URL });
    expect(response.data.shortKey).toEqual(SHORT_KEY);
    expect(response.data.count).toBe(2);
    expect(response.data.visits).toBe(0);
  });
});

describe('Tests for the end-point at /links for the pagination of produced short links', () => {
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
  const limit = config.PAGINATION_LIMIT;
  const paginationRequests = Math.floor(sampleUrls.length / limit);

  beforeEach(async () => {
    await clearDB();

    sampleUrls.forEach(async url => {
      await Link.transformer(url);
    });
  });

  const testPaginationOrder = (page, mode) => {
    for (let i = 1; i < page.length; i++) {
      expect(page[i][mode]).toBeLessThanOrEqual(page[i - 1][mode]);
    }
  };

  const doInitialPaginationFor = async mode => {
    const response = await doAxiosPost('links', { mode, cursor: 0 });

    expect(response.data).toHaveProperty('links');
    expect(response.data).toHaveProperty('hasNext');
    expect(response.data).toHaveProperty('cursor');
    expect(response.data.links).toHaveLength(limit);
    expect(response.data.cursor).toBe(1);
    testPaginationOrder(response.data.links, mode);
  };

  const doPaginationTestFor = async mode => {
    let cursor = 0;

    for (let i = 0; i < paginationRequests; i++) {
      const nextPage = await doAxiosPost('links', { mode, cursor });
      expect(nextPage.data.links).toHaveLength(limit);
      expect(nextPage.data.hasNext).toBe(true);
      expect(nextPage.data.cursor).toBe(cursor + 1);
      testPaginationOrder(nextPage.data.links, mode);
      cursor = nextPage.data.cursor;
    }

    const lastPage = await doAxiosPost('links', { mode, cursor });
    expect(lastPage.data.links).toHaveLength(sampleUrls.length - paginationRequests * limit);
    expect(lastPage.data.hasNext).toBe(false);
    testPaginationOrder(lastPage.data.links, mode);
  };

  test('Query generator creates the correct query objects', () => {
    const { createPaginationQuery } = require('../src/helpers/pagination');
    const curosr = 3;

    const query = createPaginationQuery(config.PAGINATION_MODE.CREATED_AT, curosr);
    expect(query).toEqual({
      order: [['id', 'DESC']],
      offset: curosr * config.PAGINATION_LIMIT,
      limit: config.PAGINATION_LIMIT,
    });
  });

  test('Initial request to the end-point with cursor = 0 should return the first page of links sorted newest to oldest', async () => {
    await doInitialPaginationFor(config.PAGINATION_MODE.CREATED_AT);
  });

  test('Initial request to the end-point with cursor = 0 should return the first page of links sorted according to most creation attempts', async () => {
    await doInitialPaginationFor(config.PAGINATION_MODE.COUNT);
  });

  test('Initial request to the end-point with cursor = 0 should return the first page of links sorted according to most visits', async () => {
    await doInitialPaginationFor(config.PAGINATION_MODE.VISITS);
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to ID number), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    await doPaginationTestFor(config.PAGINATION_MODE.CREATED_AT);
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to creation attempts), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    let links = await Link.findAll();
    links.forEach(async link => {
      link.count = Math.ceil(Math.random() * 100);
      await link.save();
    });

    await doPaginationTestFor(config.PAGINATION_MODE.COUNT);
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to visits), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    let links = await Link.findAll();
    links.forEach(async link => {
      link.visits = Math.ceil(Math.random() * 100);
      await link.save();
    });

    await doPaginationTestFor(config.PAGINATION_MODE.VISITS);
  });
});
