const {
  config: { PAGINATION_LIMIT, PAGINATION_MODE, SHORT_KEY_LENGTH },
  Link,
  User,
  functions: { doAxiosPost, clearDataBase, loginToken },
  constants: { SAMPLE_URL, SAMPLE_SHORT_KEY, ANOTHER_SAMPLE_URL, SAMPLE_USERNAME, SAMPLE_PASSWORD_HASH },
} = require('../support');

describe('Tests for the end-point at /links/shorten for shortening links', () => {
  beforeEach(async () => {
    await clearDataBase();
    await Link.create({ url: SAMPLE_URL, shortKey: SAMPLE_SHORT_KEY });
  });

  test('POST /links/shorten will result in an error message for an invalid URL', async () => {
    const response = await doAxiosPost('links/shorten', { url: 'invalid_link' });
    expect(response.data).toEqual({ error: 'Invalid URL!' });
  });

  test(`POST /links/shorten with ${ANOTHER_SAMPLE_URL} will response with a valid short key`, async () => {
    const response = await doAxiosPost('links/shorten', { url: ANOTHER_SAMPLE_URL });

    expect(typeof response.data.shortKey).toEqual('string');
    expect(response.data.shortKey).toHaveLength(SHORT_KEY_LENGTH);
    expect(response.data.count).toBe(1);
    expect(response.data.visits).toBe(0);
    expect(response.data.shortKeyLength).toBe(response.data.shortKey.length);
  });

  test(`POST /links/shorten with ${SAMPLE_URL} for which the key ${SAMPLE_SHORT_KEY} is already generated returns the key and sets the correct number of times its creation is requested`, async () => {
    const secondCreation = await doAxiosPost('links/shorten', { url: SAMPLE_URL });
    expect(secondCreation.data.shortKey).toEqual(SAMPLE_SHORT_KEY);
    expect(secondCreation.data.count).toBe(2);
    expect(secondCreation.data.visits).toBe(0);

    const thirdCreation = await doAxiosPost('links/shorten', { url: SAMPLE_URL });
    expect(thirdCreation.data.shortKey).toEqual(SAMPLE_SHORT_KEY);
    expect(thirdCreation.data.count).toBe(3);
    expect(thirdCreation.data.visits).toBe(0);
  });

  test('POST /links/shorten sets the public user as the owner of the short link when no token is provided', async () => {
    const { data } = await doAxiosPost('/links/shorten', { url: SAMPLE_URL });
    const link = await Link.findOne({ where: { shortKey: data.shortKey } });
    const user = await link.getUser();

    expect(user.username).toEqual('public');
  });

  test('POST /links/shorten sets the current user as the owner of the short link when a valid token is provided', async () => {
    const user = await User.create({ username: SAMPLE_USERNAME, hash: await SAMPLE_PASSWORD_HASH });
    const token = loginToken(user.username, user.id);
    const authorizationHeader = { Authorization: `Bearer ${token}` };
    const { data } = await doAxiosPost('/links/shorten', { url: SAMPLE_URL }, authorizationHeader);
    const link = await Link.findOne({ where: { shortKey: data.shortKey } });
    const linkUser = await link.getUser();

    expect(linkUser.username).toEqual(user.username);
  });

  test('POST /links/shorten rejects creation of links when an invalid token is provided', async () => {
    const user = await User.create({ username: SAMPLE_USERNAME, hash: await SAMPLE_PASSWORD_HASH });
    const token = loginToken(user.username, user.id);
    const authorizationHeader = { Authorization: `Bearer ${token}invalid_token` };
    const { data } = await doAxiosPost('/links/shorten', { url: SAMPLE_URL }, authorizationHeader);

    expect(data).toHaveProperty('error');
    expect(data.error).toEqual('Unauthorized access.');
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
