const {
  config: { PAGINATION_LIMIT, PAGINATION_MODE },
} = require('../support');

describe('Test for the pagination helper function', () => {
  test('Pagination query generator creates the correct query objects', () => {
    const { createPaginationQuery } = require('../../src/helpers/pagination');
    const curosr = 3;

    const query = createPaginationQuery(PAGINATION_MODE.CREATED_AT, curosr);
    expect(query).toEqual({
      order: [['id', 'DESC']],
      offset: curosr * PAGINATION_LIMIT,
      limit: PAGINATION_LIMIT,
    });
  });
});
