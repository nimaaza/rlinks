const {
  constants: { ANOTHER_SAMPLE_URL },
} = require('../support');

describe('Test for the URL validator helper function', () => {
  const { validUrl } = require('../../src/helpers/url');

  test('URL validator must return true for valid URLs, otherwise false', () => {
    expect(validUrl(ANOTHER_SAMPLE_URL)).toBe(true);
    expect(validUrl('invalid_url')).toBe(false);
  });
});
