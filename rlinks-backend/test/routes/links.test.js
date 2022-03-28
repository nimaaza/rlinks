const {
  config: { PAGINATION_LIMIT, PAGINATION_MODE, SHORT_KEY_LENGTH },
  Link,
  functions: { doAxiosGet, doAxiosPost, clearDataBase },
  constants: { SAMPLE_URL, SAMPLE_SHORT_KEY, ANOTHER_SAMPLE_URL },
} = require('../support');

describe('Tests for the Link.transformer method and the end-point at /shorten for shortening links', () => {
  const { getLinkPreviewData } = require('../../src/helpers/previews');
  let previewData;

  const checkShortKeyValidity = key => {
    expect(typeof key).toEqual('string');
    expect(key).toHaveLength(SHORT_KEY_LENGTH);
  };

  beforeEach(async () => {
    await clearDataBase();
    await Link.create({ url: SAMPLE_URL, shortKey: SAMPLE_SHORT_KEY });
    previewData = await getLinkPreviewData(ANOTHER_SAMPLE_URL);
  });

  test('Link.transformer should return falsy for an invalid URL', async () => {
    expect(await Link.transformer('invalid_url')).toBeFalsy();
  });

  test(`Link.transformer should return ${SAMPLE_SHORT_KEY} for existing ${SAMPLE_URL} incrementing its count`, async () => {
    const responseBefore = await Link.findOne({ where: { url: SAMPLE_URL } });
    await Link.transformer(SAMPLE_URL);
    const responseAfter = await Link.findOne({ where: { url: SAMPLE_URL } });

    expect(responseAfter.shortKey).toEqual(responseBefore.shortKey);
    expect(responseAfter.count).toEqual(responseBefore.count + 1);
  });

  test('Link.transformer should return required meta data and a new key for a valid URL not existing in the database', async () => {
    const response = await Link.transformer(ANOTHER_SAMPLE_URL);

    checkShortKeyValidity(response.shortKey);
    expect(response.shortKeyLength).toBe(response.shortKey.length);
    expect(response.title).toEqual(previewData.title);
    expect(response.description).toEqual(previewData.description);
    expect(response.image).toEqual(previewData.image);
  });

  test('POST /shorten will result in an error message for an invalid URL', async () => {
    const response = await doAxiosPost('links/shorten', { url: 'invalid_link' });
    expect(response.data).toEqual({ error: 'Invalid URL!' });
  });

  test(`POST /shorten with ${ANOTHER_SAMPLE_URL} will response with a valid short key`, async () => {
    const response = await doAxiosPost('links/shorten', { url: ANOTHER_SAMPLE_URL });

    checkShortKeyValidity(response.data.shortKey);
    expect(response.data.count).toBe(1);
    expect(response.data.visits).toBe(0);
    expect(response.data.shortKeyLength).toBe(response.data.shortKey.length);
  });

  test(`POST /shorten with ${SAMPLE_URL} will respond with ${SAMPLE_SHORT_KEY} and the correct number of times its creation is requested`, async () => {
    const secondCreation = await doAxiosPost('links/shorten', { url: SAMPLE_URL });
    expect(secondCreation.data.shortKey).toEqual(SAMPLE_SHORT_KEY);
    expect(secondCreation.data.count).toBe(2);
    expect(secondCreation.data.visits).toBe(0);

    const thirdCreation = await doAxiosPost('links/shorten', { url: SAMPLE_URL });
    expect(thirdCreation.data.shortKey).toEqual(SAMPLE_SHORT_KEY);
    expect(thirdCreation.data.count).toBe(3);
    expect(thirdCreation.data.visits).toBe(0);
  });
});

describe('Tests for proper redirection upon visiting a shortened link', () => {
  const numberOfPastVisits = 3;

  const visit = key => doAxiosGet(key);

  beforeEach(async () => {
    await clearDataBase();
    await Link.create({ url: SAMPLE_URL, shortKey: SAMPLE_SHORT_KEY });
  });

  test(`GET /${SAMPLE_SHORT_KEY} (a valid key) receives a redirect response`, async () => {
    const response = await visit(SAMPLE_SHORT_KEY);
    expect(response.request._redirectable._isRedirect).toBe(true);
  });

  test(`GET /${SAMPLE_SHORT_KEY} (a valid key) gets redirected to ${SAMPLE_URL}`, async () => {
    const response = await visit(SAMPLE_SHORT_KEY);
    expect(response.request._redirectable._currentUrl).toEqual(SAMPLE_URL);
  });

  test(`GET /${SAMPLE_SHORT_KEY.toLowerCase()} must be redirected to the error page with a link to the app`, async () => {
    const response = await visit(SAMPLE_SHORT_KEY.toLowerCase());
    expect(response.data).toContain('No one has ever been here before!');
    expect(response.data).toContain('We wonder how you got here?');
    expect(response.data).toContain('<a href="/">');
  });

  test('Number of times a link is visited must be recorded correctly', async () => {
    for (let i = 0; i < numberOfPastVisits; i++) {
      await visit(SAMPLE_SHORT_KEY);
    }

    const link = await Link.findOne({ where: { shortKey: SAMPLE_SHORT_KEY } });

    expect(link.visits).toBe(numberOfPastVisits);
  });
});

describe('Tests for the end-point at /links for the pagination of produced short links', () => {
  const urls = require('../../data');
  const paginationRequests = Math.floor(urls.length / PAGINATION_LIMIT);
  const { CREATED_AT, COUNT, VISITS } = PAGINATION_MODE;

  beforeAll(async () => {
    await clearDataBase();

    urls.forEach(async url => {
      await Link.transformer(url);
    });
  });

  const testPaginationOrder = (page, mode) => {
    for (let i = 1; i < page.length; i++) {
      expect(page[i][mode]).toBeLessThanOrEqual(page[i - 1][mode]);
    }
  };

  const doInitialPaginationTest = async mode => {
    const response = await doAxiosPost('links', { mode, cursor: 0 });

    expect(response.data).toHaveProperty('links');
    expect(response.data).toHaveProperty('hasNext');
    expect(response.data).toHaveProperty('cursor');
    expect(response.data.links).toHaveLength(PAGINATION_LIMIT);
    expect(response.data.cursor).toBe(1);
    testPaginationOrder(response.data.links, mode);
  };

  const doNextPaginationTest = async mode => {
    let cursor = 0;

    for (let i = 0; i < paginationRequests; i++) {
      const nextPage = await doAxiosPost('links', { mode, cursor });
      expect(nextPage.data.links).toHaveLength(PAGINATION_LIMIT);
      expect(nextPage.data.hasNext).toBe(true);
      expect(nextPage.data.cursor).toBe(cursor + 1);
      testPaginationOrder(nextPage.data.links, mode);
      cursor = nextPage.data.cursor;
    }

    const lastPage = await doAxiosPost('links', { mode, cursor });
    expect(lastPage.data.links).toHaveLength(urls.length - paginationRequests * PAGINATION_LIMIT);
    expect(lastPage.data.hasNext).toBe(false);
    testPaginationOrder(lastPage.data.links, mode);
  };

  test('Initial request to the end-point with cursor = 0 should return the first page of links sorted newest to oldest', async () => {
    await doInitialPaginationTest(CREATED_AT);
  });

  test('Initial request to the end-point with cursor = 0 should return the first page of links sorted according to most creation attempts', async () => {
    await doInitialPaginationTest(COUNT);
  });

  test('Initial request to the end-point with cursor = 0 should return the first page of links sorted according to most visits', async () => {
    await doInitialPaginationTest(VISITS);
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to ID number), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    await doNextPaginationTest(CREATED_AT);
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to creation attempts), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    let links = await Link.findAll();
    links.forEach(async link => {
      link.count = Math.ceil(Math.random() * 100);
      await link.save();
    });

    await doNextPaginationTest(COUNT);
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to visits), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    let links = await Link.findAll();
    links.forEach(async link => {
      link.visits = Math.ceil(Math.random() * 100);
      await link.save();
    });

    await doNextPaginationTest(VISITS);
  });
});
