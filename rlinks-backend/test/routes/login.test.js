const jwt = require('jsonwebtoken');
const {
  config: { JWT_SECRET },
  User,
  constants: { SAMPLE_USERNAME, SAMPLE_PASSWORD, SAMPLE_PASSWORD_HASH },
  functions: { clearDataBase, doAxiosPost },
} = require('../support');

describe('Tests for the login functionality', () => {
  let userId;

  beforeEach(async () => {
    await clearDataBase();
    const user = await User.create({ username: SAMPLE_USERNAME, hash: await SAMPLE_PASSWORD_HASH });
    userId = user.id;
  });

  const testLoginFail = async falseCredentials => {
    const { data } = await doAxiosPost('/login', falseCredentials);

    expect(data).toHaveProperty('error');
    expect(data).not.toHaveProperty('token');
    expect(data).not.toHaveProperty('username');
    expect(data.error).toEqual('Invalid username and/or password.');
  };

  test('POST /login with public as the username will be prohibited', async () => {
    const { data } = await doAxiosPost('/login', { username: 'public', password: 'whatever' });

    expect(data).toHaveProperty('error');
    expect(data).not.toHaveProperty('token');
    expect(data).not.toHaveProperty('username');
    expect(data.error).toEqual('Unauthorized access.');
  });

  test('POST /login with invalid username receives an error in response', async () => {
    await testLoginFail({
      username: 'invalid_username',
      password: SAMPLE_PASSWORD,
    });
  });

  test('POST /login with valid username but invalid password receives an error in response', async () => {
    await testLoginFail({
      username: SAMPLE_USERNAME,
      password: 'invalid_password',
    });
  });

  test('POST /login with valid username and valid password receives a verifiable token in response', async () => {
    const correctCredentials = {
      username: SAMPLE_USERNAME,
      password: SAMPLE_PASSWORD,
    };
    const { data } = await doAxiosPost('/login', correctCredentials);

    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('username');
    expect(data.username).toEqual(SAMPLE_USERNAME);

    const verifiedToken = jwt.verify(data.token, JWT_SECRET);
    expect(verifiedToken).toHaveProperty('username');
    expect(verifiedToken).toHaveProperty('id');
    expect(verifiedToken.username).toEqual(SAMPLE_USERNAME);
    expect(verifiedToken.id).toEqual(userId);
  });
});
