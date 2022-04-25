const {
  config: { SHORT_KEY_LENGTH },
  Link,
  functions: { clearDataBase },
  constants: { SAMPLE_URL, SAMPLE_SHORT_KEY, ANOTHER_SAMPLE_URL, ANOTHER_SAMPLE_SHORT_KEY },
} = require('../../support');

describe('Basic tests for the Link model', () => {
  const { getLinkPreviewData } = require('../../../src/helpers/previews');
  let previewData;

  beforeEach(async () => {
    await clearDataBase();
    previewData = await getLinkPreviewData(ANOTHER_SAMPLE_URL);
  });

  const checkReturnedLink = link => {
    expect(link).toHaveProperty('url');
    expect(link).toHaveProperty('shortKey');
    expect(link).toHaveProperty('count');
    expect(link).toHaveProperty('visits');
    expect(link).toHaveProperty('title');
    expect(link).toHaveProperty('description');
    expect(link).toHaveProperty('image');
    expect(link).toHaveProperty('createdAt');
    expect(link).toHaveProperty('updatedAt');
    expect(link).toHaveProperty('id');
  };

  test('Basic create, read, update, and delete operations on the Link model work', async () => {
    const createdLink = await Link.create({ url: SAMPLE_URL, shortKey: SAMPLE_SHORT_KEY });

    checkReturnedLink(createdLink);
    expect(createdLink.url).toEqual(SAMPLE_URL);
    expect(createdLink.shortKey).toEqual(SAMPLE_SHORT_KEY);
    expect(createdLink.count).toBe(1);
    expect(createdLink.visits).toBe(0);
    expect(createdLink.shortKeyLength).toBe(SAMPLE_SHORT_KEY.length);

    const readLink = await Link.findOne({ where: { shortKey: SAMPLE_SHORT_KEY } });
    checkReturnedLink(readLink);
    expect(readLink.url).toEqual(SAMPLE_URL);
    expect(readLink.shortKey).toEqual(SAMPLE_SHORT_KEY);
    expect(readLink.count).toBe(1);
    expect(readLink.visits).toBe(0);
    expect(readLink.shortKeyLength).toBe(SAMPLE_SHORT_KEY.length);

    const updatedLink = await readLink.update({
      url: ANOTHER_SAMPLE_URL,
      shortKey: ANOTHER_SAMPLE_SHORT_KEY,
      count: 10,
      visits: 11,
    });
    checkReturnedLink(updatedLink);
    expect(updatedLink.url).toEqual(ANOTHER_SAMPLE_URL);
    expect(updatedLink.shortKey).toEqual(ANOTHER_SAMPLE_SHORT_KEY);
    expect(updatedLink.count).toBe(10);
    expect(updatedLink.visits).toBe(11);
    expect(updatedLink.shortKeyLength).toBe(ANOTHER_SAMPLE_SHORT_KEY.length);

    await updatedLink.destroy();
    const allLinksInDb = await Link.findAll();
    expect(allLinksInDb).toHaveLength(0);
  });

  test('Link.transformer should return falsy for an invalid URL', async () => {
    expect(await Link.transformer('invalid_url', 'public')).toBeFalsy();
  });

  test(`Link.transformer should return ${SAMPLE_SHORT_KEY} for existing ${SAMPLE_URL} incrementing its count`, async () => {
    await Link.create({ url: SAMPLE_URL, shortKey: SAMPLE_SHORT_KEY });
    const responseBefore = await Link.findOne({ where: { url: SAMPLE_URL } });
    await Link.transformer(SAMPLE_URL, 'public');
    const responseAfter = await Link.findOne({ where: { url: SAMPLE_URL } });

    expect(responseAfter.shortKey).toEqual(responseBefore.shortKey);
    expect(responseAfter.count).toEqual(responseBefore.count + 1);
  });

  test('Link.transformer should return required meta data and a new key for a valid URL not existing in the database', async () => {
    const response = await Link.transformer(ANOTHER_SAMPLE_URL, 'public');

    expect(typeof response.shortKey).toEqual('string');
    expect(response.shortKey).toHaveLength(SHORT_KEY_LENGTH);
    expect(response.shortKeyLength).toBe(response.shortKey.length);
    expect(response.title).toEqual(previewData.title);
    expect(response.description).toEqual(previewData.description);
    expect(response.image).toEqual(previewData.image);
  });
});
