const {
  config,
  Link,
  functions: { doAxiosPost, clearDataBase },
  constants: { youTubeLink, URL, SHORT_KEY, TEST_URL },
} = require('./support');

describe('Tests for the Link.transformer method and the end-point at /shorten for shortening links', () => {
  const { getLinkPreviewData } = require('../src/helpers/previews');
  let previewData;

  const checkShortKeyValidity = key => {
    expect(typeof key).toEqual('string');
    expect(key).toHaveLength(config.SHORT_KEY_LENGTH);
  };

  beforeEach(async () => {
    await clearDataBase();
    await Link.create(youTubeLink);
    previewData = await getLinkPreviewData(TEST_URL);
  });

  test('Link.transformer should return falsy for an invalid URL', async () => {
    expect(await Link.transformer('invalid_url')).toBeFalsy();
  });

  test(`Link.transformer should return ${SHORT_KEY} for existing ${URL} incrementing its count`, async () => {
    const responseBefore = await Link.findOne({ where: { url: URL } });
    await Link.transformer(URL);
    const responseAfter = await Link.findOne({ where: { url: URL } });

    expect(responseAfter.shortKey).toEqual(responseBefore.shortKey);
    expect(responseAfter.count).toEqual(responseBefore.count + 1);
  });

  test('Link.transformer should return required meta data and a new key for a valid URL not existing in the database', async () => {
    const response = await Link.transformer(TEST_URL);

    checkShortKeyValidity(response.shortKey);
    expect(response.title).toEqual(previewData.title);
    expect(response.description).toEqual(previewData.description);
    expect(response.image).toEqual(previewData.image);
  });

  test('POST /shorten will result in an error message for an invalid URL', async () => {
    const response = await doAxiosPost('shorten', { url: 'invalid_link' });
    expect(response.data).toEqual({ error: 'Invalid URL!' });
  });

  test(`POST /shorten with ${TEST_URL} will response with a valid short key`, async () => {
    const response = await doAxiosPost('shorten', { url: TEST_URL });

    checkShortKeyValidity(response.data.shortKey);
    expect(response.data.count).toBe(1);
    expect(response.data.visits).toBe(0);
  });

  test(`POST /shorten with ${URL} will respond with ${SHORT_KEY} and the correct number of times its creation is requested`, async () => {
    const secondCreation = await doAxiosPost('shorten', { url: URL });
    expect(secondCreation.data.shortKey).toEqual(SHORT_KEY);
    expect(secondCreation.data.count).toBe(2);
    expect(secondCreation.data.visits).toBe(0);

    const thirdCreation = await doAxiosPost('shorten', { url: URL });
    expect(thirdCreation.data.shortKey).toEqual(SHORT_KEY);
    expect(thirdCreation.data.count).toBe(3);
    expect(thirdCreation.data.visits).toBe(0);
  });
});