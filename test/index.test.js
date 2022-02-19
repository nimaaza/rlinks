const axios = require('axios');

const config = require('../config');
const server = require('../index');

describe('Test basic backend behaviour', () => {
  test('GET /live responds with rlinks is live', async () => {
    const response = await axios.get(`${config.URL}/live`);
    expect(response.data).toBe('rlinks is live!');
  });

  test('GET / responds with appropriate index.html file', async () => {
    const response = await axios.get(`${config.URL}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.data).toContain(
      '<title>RLinks - link reducer service</title>'
    );
  });

  test('POST / will receive the URL included in the request body', async () => {
    const response = await axios.post(
      `${config.URL}`,
      { url: 'https://www.youtube.com/watch?v=LPLKOLJAbds' },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const body = response.data;
    expect(body.url).toEqual('https://www.youtube.com/watch?v=LPLKOLJAbds');
  });
});

afterAll(() => {
  server.close();
});
