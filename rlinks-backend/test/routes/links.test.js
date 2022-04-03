const {
  config: { PAGINATION_LIMIT, PAGINATION_MODE, SHORT_KEY_LENGTH },
  Link,
  User,
  functions: { doAxiosPost, doAxiosDelete, clearDataBase, loginToken },
  constants: {
    SAMPLE_URL,
    SAMPLE_SHORT_KEY,
    ANOTHER_SAMPLE_URL,
    SAMPLE_USERNAME,
    SAMPLE_PASSWORD_HASH,
    ANOTHER_SAMPLE_USERNAME,
    ANOTHER_SAMPLE_PASSWORD_HASH,
  },
} = require('../support');

const urls = require('../../data');
const { CREATED_AT, COUNT, VISITS } = PAGINATION_MODE;

const doInitialPaginationTest = async (query, userId, headers) => {
  const response = await doAxiosPost('links', query, headers);

  expect(response.data).toHaveProperty('links');
  expect(response.data).toHaveProperty('hasNext');
  expect(response.data).toHaveProperty('cursor');
  expect(response.data.links).toHaveLength(PAGINATION_LIMIT);
  expect(response.data.cursor).toBe(1);
  testPaginationOrder(response.data.links, query.mode);

  if (userId) {
    checkUserId(response.data.links, userId);
  }
};

const doNextPaginationTest = async (linksCount, paginations, query, userId, headers) => {
  const mode = query.mode;
  let cursor = 0;

  for (let i = 0; i < paginations; i++) {
    query.cursor = cursor;
    const nextPage = await doAxiosPost('links', query, headers);
    expect(nextPage.data.links).toHaveLength(PAGINATION_LIMIT);
    expect(nextPage.data.hasNext).toBe(true);
    expect(nextPage.data.cursor).toBe(cursor + 1);
    testPaginationOrder(nextPage.data.links, mode);
    cursor = nextPage.data.cursor;

    if (userId) {
      checkUserId(nextPage.data.links, userId);
    }
  }

  query.cursor = cursor;
  const lastPage = await doAxiosPost('links', query, headers);
  expect(lastPage.data.links).toHaveLength(linksCount - paginations * PAGINATION_LIMIT);
  expect(lastPage.data.hasNext).toBe(false);
  testPaginationOrder(lastPage.data.links, mode);

  if (userId) {
    checkUserId(lastPage.data.links, userId);
  }
};

const testPaginationOrder = (page, mode) => {
  for (let i = 1; i < page.length; i++) {
    expect(page[i][mode]).toBeLessThanOrEqual(page[i - 1][mode]);
  }
};

const checkUserId = (links, id) => links.forEach(link => expect(link.UserId).toEqual(id));

const countLoadedLinks = async (query, expectedCount, headers) => {
  let linksCount = 0;
  let data;

  do {
    const response = await doAxiosPost('links', query, headers);
    data = response.data;
    linksCount += data.links.length;
    query.cursor = data.cursor;
  } while (data.hasNext);

  expect(linksCount).toEqual(expectedCount);
};

describe('Tests for the end-point at /links/shorten for shortening links', () => {
  beforeEach(async () => {
    await clearDataBase();
  });

  test('POST /links/shorten will result in an error message for an invalid URL', async () => {
    const response = await doAxiosPost('links/shorten', { url: 'invalid_link' });
    expect(response.data).toEqual({ error: 'Invalid URL!' });
  });

  test(`POST /links/shorten with ${ANOTHER_SAMPLE_URL} will responsd with a valid short key`, async () => {
    const response = await doAxiosPost('links/shorten', { url: ANOTHER_SAMPLE_URL });

    expect(typeof response.data.shortKey).toEqual('string');
    expect(response.data.shortKey).toHaveLength(SHORT_KEY_LENGTH);
    expect(response.data.count).toBe(1);
    expect(response.data.visits).toBe(0);
    expect(response.data.shortKeyLength).toBe(response.data.shortKey.length);
  });

  test(`POST /links/shorten with ${SAMPLE_URL} for which the key ${SAMPLE_SHORT_KEY} is already generated returns the key and sets the correct number of times its creation is requested`, async () => {
    await Link.create({ url: SAMPLE_URL, shortKey: SAMPLE_SHORT_KEY });
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

describe('Tests for the end-point at /links for the pagination of produced short links (no user logged in)', () => {
  const paginationRequests = Math.floor(urls.length / PAGINATION_LIMIT);

  beforeAll(async () => {
    await clearDataBase();
    urls.forEach(async url => {
      await Link.transformer(url, 'public');
    });

    // The first test in this suit fails seemingly because the
    // database is not in a consistent state when the tests begin
    // to run. This following two queries delay the running of
    // the tests and are meant as a quick and temporary work around
    // until a better solution is found.
    await Link.findAll({});
    await User.findAll({});
  });

  test('Initial request to the end-point with cursor = 0 should return the first page of links sorted newest to oldest', async () => {
    await doInitialPaginationTest({ mode: CREATED_AT, cursor: 0 });
  });

  test('Initial request to the end-point with cursor = 0 should return the first page of links sorted according to most creation attempts', async () => {
    await doInitialPaginationTest({ mode: COUNT, cursor: 0 });
  });

  test('Initial request to the end-point with cursor = 0 should return the first page of links sorted according to most visits', async () => {
    await doInitialPaginationTest({ mode: VISITS, cursor: 0 });
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to ID number), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    await doNextPaginationTest(urls.length, paginationRequests, { mode: CREATED_AT, cursor: 0 });
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to creation attempts), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    let links = await Link.findAll();
    links.forEach(async link => {
      link.count = Math.ceil(Math.random() * 100);
      await link.save();
    });

    await doNextPaginationTest(urls.length, paginationRequests, { mode: COUNT, cursor: 0 });
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to visits), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    let links = await Link.findAll();
    links.forEach(async link => {
      link.visits = Math.ceil(Math.random() * 100);
      await link.save();
    });

    await doNextPaginationTest(urls.length, paginationRequests, { mode: VISITS, cursor: 0 });
  });

  test('Pagination should load all links when mine is missing', async () => {
    await countLoadedLinks({ mode: CREATED_AT, cursor: 0 }, urls.length);
    await countLoadedLinks({ mode: COUNT, cursor: 0 }, urls.length);
    await countLoadedLinks({ mode: VISITS, cursor: 0 }, urls.length);
  });

  test('Pagination should load all links when mine is set to false', async () => {
    await countLoadedLinks({ mode: CREATED_AT, cursor: 0, mine: false }, urls.length);
    await countLoadedLinks({ mode: COUNT, cursor: 0, mine: false }, urls.length);
    await countLoadedLinks({ mode: VISITS, cursor: 0, mine: false }, urls.length);
  });
});

describe('Tests for the end-point at /links for the pagination of produced short links (with user logged in)', () => {
  let user, authorizationHeader;
  const numberOfLinksWithPublicUser = 5;
  const paginationRequests = Math.floor((urls.length - numberOfLinksWithPublicUser) / PAGINATION_LIMIT);

  beforeAll(async () => {
    await clearDataBase();
    user = await User.create({ username: SAMPLE_USERNAME, hash: await SAMPLE_PASSWORD_HASH });
    authorizationHeader = { Authorization: `Bearer ${loginToken(user.username, user.id)}` };

    urls.forEach(async (url, index) => {
      if (index < numberOfLinksWithPublicUser) {
        await Link.transformer(url, 'public');
      } else {
        await Link.transformer(url, user.username);
      }
    });

    // The first test in this suit fails seemingly because the
    // database is not in a consistent state when the tests begin
    // to run. This following two queries delay the running of
    // the tests and are meant as a quick and temporary work around
    // until a better solution is found.
    await Link.findAll({});
    await User.findAll({});
  });

  test('Initial request to the end-point with cursor = 0, mine = true should return the first page of own links sorted newest to oldest', async () => {
    await doInitialPaginationTest({ mode: CREATED_AT, cursor: 0, mine: true }, user.id, authorizationHeader);
  });

  test('Initial request to the end-point with cursor = 0, mine = true should return the first page of own of links sorted according to most creation attempts', async () => {
    await doInitialPaginationTest({ mode: COUNT, cursor: 0, mine: true }, user.id, authorizationHeader);
  });

  test('Initial request to the end-point with cursor = 0, mine = true should return the first page of own of links sorted according to most visits', async () => {
    await doInitialPaginationTest({ mode: VISITS, cursor: 0, mine: true }, user.id, authorizationHeader);
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to ID number), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    await doNextPaginationTest(
      urls.length - numberOfLinksWithPublicUser,
      paginationRequests,
      { mode: CREATED_AT, cursor: 0, mine: true },
      user.id,
      authorizationHeader
    );
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to creation attempts), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    let links = await Link.findAll();
    links.forEach(async link => {
      link.count = Math.ceil(Math.random() * 100);
      await link.save();
    });

    await doNextPaginationTest(
      urls.length - numberOfLinksWithPublicUser,
      paginationRequests,
      { mode: COUNT, cursor: 0, mine: true },
      user.id,
      authorizationHeader
    );
  });

  test(`On the first ${paginationRequests} pagination requests (sorted according to visits), hasNext must return true, on the ${
    paginationRequests + 1
  }th request must return false with the remaining number of last page links`, async () => {
    let links = await Link.findAll();
    links.forEach(async link => {
      link.visits = Math.ceil(Math.random() * 100);
      await link.save();
    });

    await doNextPaginationTest(
      urls.length - numberOfLinksWithPublicUser,
      paginationRequests,
      { mode: VISITS, cursor: 0, mine: true },
      user.id,
      authorizationHeader
    );
  });

  test('Pagination should load all own links when mine is set to true', async () => {
    await countLoadedLinks(
      { mode: CREATED_AT, cursor: 0, mine: true },
      urls.length - numberOfLinksWithPublicUser,
      authorizationHeader
    );
    await countLoadedLinks(
      { mode: COUNT, cursor: 0, mine: true },
      urls.length - numberOfLinksWithPublicUser,
      authorizationHeader
    );
    await countLoadedLinks(
      { mode: VISITS, cursor: 0, mine: true },
      urls.length - numberOfLinksWithPublicUser,
      authorizationHeader
    );
  });
});

describe('Tests for deletion of created short links', () => {
  let user, headers, publicLink, userLink;

  beforeEach(async () => {
    await clearDataBase();
    user = await User.create({
      username: SAMPLE_USERNAME,
      hash: await SAMPLE_PASSWORD_HASH,
    });

    publicLink = await Link.transformer(SAMPLE_URL, 'public');
    userLink = await Link.transformer(ANOTHER_SAMPLE_URL, user.username);

    headers = { Authorization: `Bearer ${loginToken(user.username, user.id)}` };
  });

  const numberOfLinks = async () => (await Link.findAll({})).length;

  test('DELETE /links/:id will be rejected if no token is provided', async () => {
    const numberOfLinksBefore = await numberOfLinks();
    const { data } = await doAxiosDelete(`/links/${userLink.id}`);
    const numberOfLinksAfter = await numberOfLinks();

    expect(data).toHaveProperty('error');
    expect(data.error).toEqual('Unauthorized access.');
    expect(numberOfLinksAfter).toBe(numberOfLinksBefore);
  });

  test('DELETE /links/:id will be rejected if a link with given id does not exist', async () => {
    const numberOfLinksBefore = await numberOfLinks();
    const { data } = await doAxiosDelete(`/links/${userLink.id + 100}`, headers);
    const numberOfLinksAfter = await numberOfLinks();

    expect(data).toHaveProperty('error');
    expect(data.error).toEqual('Unauthorized access.');
    expect(numberOfLinksAfter).toBe(numberOfLinksBefore);
  });

  test('DELETE /links/:id will be rejected if token is not valid', async () => {
    const numberOfLinksBefore = await numberOfLinks();
    headers.Authorization = `${headers.Authorization}make_token_invalid`;
    const { data } = await doAxiosDelete(`/links/${userLink.id + 100}`, headers);
    const numberOfLinksAfter = await numberOfLinks();

    expect(data).toHaveProperty('error');
    expect(data.error).toEqual('Unauthorized access.');
    expect(numberOfLinksAfter).toBe(numberOfLinksBefore);
  });

  test('DELETE /links/:id will be rejected for a short link owned by public user', async () => {
    const numberOfLinksBefore = await numberOfLinks();
    const { data } = await doAxiosDelete(`/links/${publicLink.id}`, headers);
    const numberOfLinksAfter = await numberOfLinks();

    expect(data).toHaveProperty('error');
    expect(data.error).toEqual('Unauthorized access.');
    expect(numberOfLinksAfter).toBe(numberOfLinksBefore);
  });

  test('DELETE /links/:id will be rejected if link belongs to another user', async () => {
    const anotherUser = await User.create({
      username: ANOTHER_SAMPLE_USERNAME,
      hash: await ANOTHER_SAMPLE_PASSWORD_HASH,
    });
    const anotherLink = await Link.transformer('https://www.google.com/', anotherUser.username);
    const numberOfLinksBefore = await numberOfLinks();
    const { data } = await doAxiosDelete(`/links/${anotherLink.id}`, headers);
    const numberOfLinksAfter = await numberOfLinks();

    expect(data).toHaveProperty('error');
    expect(data.error).toEqual('Unauthorized access.');
    expect(numberOfLinksAfter).toBe(numberOfLinksBefore);
  });

  test('DELETE /links/:id will succeed if a valid token is given and link belongs to requesting user', async () => {
    const numberOfLinksBefore = await numberOfLinks();
    const { data } = await doAxiosDelete(`/links/${userLink.id}`, headers);
    const numberOfLinksAfter = await numberOfLinks();

    expect(data).toHaveProperty('message');
    expect(data.message).toEqual('Link deleted.');
    expect(numberOfLinksAfter).toBe(numberOfLinksBefore - 1);
  });
});
