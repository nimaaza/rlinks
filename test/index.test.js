const axios = require('axios');

const config = require('../config');

describe('Test /live path', () => {
  test('GET /live responds with rlinks is live', async () => {
    const response = await axios.get(`${config.URL}/live`);
    expect(response.data).toBe('rlinks is live!');
  });
});
