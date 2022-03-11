const {
  config: { PAGINATION_LIMIT, PAGINATION_MODE },
  Link,
  functions: { doAxiosPost, clearDataBase },
} = require('./support');

describe('Tests for the end-point at /links for the pagination of produced short links', () => {
  const urls = require('../data');
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
