const {
  config,
  constants: { ANOTHER_SAMPLE_URL },
} = require('./support');

describe('Tests for utility helper functions', () => {
  const { randomAlphaNumbericString } = require('../src/helpers/randomize');
  const { validUrl } = require('../src/helpers/url');

  const { SHORT_KEY_LENGTH } = config;
  const numberOfStringsToCompare = 10000;

  test('URL validator must return true for valid URLs, otherwise false', () => {
    expect(validUrl(ANOTHER_SAMPLE_URL)).toBe(true);
    expect(validUrl('invalid_url')).toBe(false);
  });

  test(`Expect return value of the random key generator to be a string of length ${SHORT_KEY_LENGTH}`, () => {
    const randomString = randomAlphaNumbericString(SHORT_KEY_LENGTH);
    expect(typeof randomString).toBe('string');
    expect(randomString).toHaveLength(SHORT_KEY_LENGTH);
  });

  test(`Expect ${numberOfStringsToCompare} generated random strings to have different values`, () => {
    const randomStrings = [];
    for (let i = 0; i < numberOfStringsToCompare; i++) {
      randomStrings.push(randomAlphaNumbericString(SHORT_KEY_LENGTH));
    }

    const randomStringsSet = new Set(randomStrings);

    expect(randomStringsSet.size).toBe(numberOfStringsToCompare);
  });

  test('Pagination query generator creates the correct query objects', () => {
    const { PAGINATION_LIMIT, PAGINATION_MODE } = config;
    const { createPaginationQuery } = require('../src/helpers/pagination');
    const curosr = 3;

    const query = createPaginationQuery(PAGINATION_MODE.CREATED_AT, curosr);
    expect(query).toEqual({
      order: [['id', 'DESC']],
      offset: curosr * PAGINATION_LIMIT,
      limit: PAGINATION_LIMIT,
    });
  });
});
