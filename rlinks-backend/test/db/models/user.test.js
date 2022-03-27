const {
  User,
  functions: { clearDataBase },
  constants: { SAMPLE_USERNAME, SAMPLE_PASSWORD, SAMPLE_PASSWORD_HASH },
} = require('../../support');

describe('Basic tests for the User model', () => {
  const bcrypt = require('bcrypt');

  beforeEach(async () => {
    await clearDataBase();
    await User.initializePublicUser();
  });

  const checkReturnedUser = async user => {
    expect(user).toHaveProperty('username');
    expect(user).toHaveProperty('hash');
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  };

  test('Basic create, read, update, and delete operations on the User model work', async () => {
    const createdUser = await User.create({
      username: SAMPLE_USERNAME,
      hash: await SAMPLE_PASSWORD_HASH,
    });

    checkReturnedUser(createdUser);
    expect(createdUser.username).toEqual(SAMPLE_USERNAME);
    expect(await bcrypt.compare(SAMPLE_PASSWORD, createdUser.hash)).toBe(true);

    const readUser = await User.findOne({ where: { username: SAMPLE_USERNAME } });
    checkReturnedUser(readUser);
    expect(createdUser.username).toEqual(SAMPLE_USERNAME);
    expect(await bcrypt.compare(SAMPLE_PASSWORD, createdUser.hash)).toBe(true);

    const updatedUser = await readUser.update({ hash: '123456789' });
    expect(updatedUser.hash).toBe('123456789');

    await readUser.destroy();
    const allUsersInDb = await User.findAll();
    expect(allUsersInDb).toHaveLength(1); // public user should be there
  });

  test('Database will make sure usernames are unique', async () => {
    try {
      await User.create({
        username: SAMPLE_USERNAME,
        hash: await SAMPLE_PASSWORD_HASH,
      });

      await User.create({
        username: SAMPLE_USERNAME,
        hash: '12345789',
      });
    } catch (err) {
      expect(err.message).toEqual('Validation error');
    }
  });

  test('The users table should include a public user with empty password', async () => {
    const publicUser = await User.findOne({ where: { username: 'public' } });
    expect(publicUser).not.toBe(null);
    expect(publicUser.username).toEqual('public');
    expect(publicUser.hash).toEqual('');
  });
});
