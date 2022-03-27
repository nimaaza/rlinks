const {
  config: { SHORT_KEY_LENGTH },
} = require('../support');

describe('Tests for the random string generator helper function', () => {
  const { randomAlphaNumbericString } = require('../../src/helpers/randomize');
  const numberOfStringsToCompare = 10000;

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
});
