const {
  Link,
  functions: { clearDataBase },
  constants: { SAMPLE_URL, SAMPLE_SHORT_KEY },
} = require('./support');

describe('Basic tests for the Link model', () => {
  beforeEach(async () => {
    await clearDataBase();
  });

  const checkReturnedLink = link => {
    expect(link.url).toEqual(SAMPLE_URL);
    expect(link.shortKey).toEqual(SAMPLE_SHORT_KEY);
    expect(link.count).toBe(1);
    expect(link.visits).toBe(0);
    expect(link.shortKeyLength).toBe(SAMPLE_SHORT_KEY.length);
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

    const readLink = await Link.findOne({ where: { shortKey: SAMPLE_SHORT_KEY } });
    checkReturnedLink(readLink);

    const updatedLink = await readLink.update({ count: 10 });
    expect(updatedLink.count).toBe(10);

    await readLink.destroy();
    const allLinksInDb = await Link.findAll();
    expect(allLinksInDb).toHaveLength(0);
  });
});
