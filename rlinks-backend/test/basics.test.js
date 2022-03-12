const {
  Link,
  functions: { doAxiosGet, doAxiosPost, clearDataBase },
  constants: { youTubeLink, URL },
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

describe('Basic tests for the database', () => {
  beforeEach(async () => {
    await clearDataBase();
  });

  const checkReturnedLink = link => {
    expect(link.url).toEqual(youTubeLink.url);
    expect(link.shortKey).toEqual(youTubeLink.shortKey);
    expect(link.count).toBe(1);
    expect(link.visits).toBe(0);
    expect(link).toHaveProperty('title');
    expect(link).toHaveProperty('description');
    expect(link).toHaveProperty('image');
    expect(link).toHaveProperty('createdAt');
    expect(link).toHaveProperty('updatedAt');
    expect(link).toHaveProperty('id');
  };

  test('Basic create, read, and delete operations on the Link model work', async () => {
    const createdLink = await Link.create(youTubeLink);
    checkReturnedLink(createdLink);

    const readLink = await Link.findOne({ where: { shortKey: youTubeLink.shortKey } });
    checkReturnedLink(readLink);

    await readLink.destroy();
    const allLinksInDb = await Link.findAll();
    expect(allLinksInDb).toHaveLength(0);
  });
});
