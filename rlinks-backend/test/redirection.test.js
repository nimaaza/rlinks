const {
  Link,
  functions: { doAxiosGet, clearDataBase },
  constants: { SAMPLE_URL, SAMPLE_SHORT_KEY },
} = require('./support');

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
