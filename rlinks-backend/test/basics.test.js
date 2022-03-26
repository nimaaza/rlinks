const {
  functions: { doAxiosGet, doAxiosPost },
  constants: { SAMPLE_URL },
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
