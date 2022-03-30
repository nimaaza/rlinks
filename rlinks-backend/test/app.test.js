const {
  Link,
  functions: { clearDataBase, doAxiosGet, doAxiosPost },
  constants: { SAMPLE_SHORT_KEY, SAMPLE_URL },
} = require('./support');

describe('Test basic backend behaviour to check everything is correctly setup', () => {
  test('GET /live responds with rlinks is live', async () => {
    const response = await doAxiosGet('live');
    expect(response.data).toBe('rlinks is live!');
  });

  test('GET / responds with appropriate index.html file', async () => {
    const response = await doAxiosGet('');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.data).toContain('<title>RLinks - link reducer service</title>');
  });

  test('POST / will receive the URL included in the request body', async () => {
    const response = await doAxiosPost('', { url: SAMPLE_URL });
    expect(response.data.url).toEqual(SAMPLE_URL);
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
