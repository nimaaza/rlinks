const axios = require('axios');

const config = require('../config');
const server = require('../index');

describe('Test basic backend behaviour', () => {
  test('GET /live responds with rlinks is live', async () => {
    const response = await axios.get(`${config.URL}/live`);
    expect(response.data).toBe('rlinks is live!');
  });
afterAll(() => {
  server.close();
});
