/* eslint-disable no-unused-vars */
const {
  User,
  constants: { SAMPLE_USERNAME, SAMPLE_PASSWORD_HASH },
  functions: { loginToken },
} = require('../support');

describe('Tests for custom middleware functions', () => {
  const { authorizationMiddleware, setUserMiddleware } = require('../../src/helpers/middlewares');
  let user, token;

  let nextCalled, nextCalledWithError, internalMessage, externalMessage;

  const next = error => {
    nextCalled = true;
    if (error) {
      nextCalledWithError = true;
      internalMessage = error.message;
      externalMessage = error.externalMessage;
    }
  };

  const checkErrorStatus = expectedInternalMessage => {
    expect(nextCalled).toBe(true);
    expect(nextCalledWithError).toBe(true);
    expect(internalMessage).toEqual(expectedInternalMessage);
    expect(externalMessage).toEqual('Unauthorized access.');
  };

  beforeAll(async () => {
    user = await User.create({ username: SAMPLE_USERNAME, hash: await SAMPLE_PASSWORD_HASH });
    token = loginToken(user.username, user.id);
  });

  beforeEach(() => {
    nextCalled = false;
    nextCalledWithError = false;
    internalMessage = '';
    externalMessage = '';
  });

  test('The authorizationMiddleware function calls next() with error when no token is provided', () => {
    const request = { get: header => null };
    authorizationMiddleware(request, null, next);
    checkErrorStatus('Token is missing.');
  });

  test('The authorizationMiddleware function calls next() with error when Authorization header is not properly set', () => {
    const request = { get: header => 'some random string that does not start with bearer' };
    authorizationMiddleware(request, null, next);
    checkErrorStatus('Token is missing.');
  });

  test('The authorizationMiddleware function calls next() with error when token has invalid signature and is not verifiable', () => {
    const request = { get: header => `Bearer ${token}yyy` };
    authorizationMiddleware(request, null, next);
    checkErrorStatus('invalid signature');
  });

  test('The authorizationMiddleware function calls next() with error when token has been modified and is not verifiable', () => {
    const request = { get: header => `Bearer xxx${token}` };
    authorizationMiddleware(request, null, next);
    checkErrorStatus('invalid token');

    request.get = header => `Bearer xxx${token}yyy`;
    authorizationMiddleware(request, null, next);
    checkErrorStatus('invalid token');

    const charInToken = token[Math.floor(token.length / 4)];
    const anotherCharInToken = token[Math.floor(token.length / 3)];
    request.get = header => `Bearer ${token.replace(charInToken, anotherCharInToken)}`;
    authorizationMiddleware(request, null, next);
    checkErrorStatus('invalid token');
  });

  test('The authorizationMiddleware function calls next() with error when token is verified but does not include both username and id', () => {
    const request = { get: header => `Bearer ${loginToken(user.username, null)}` };
    authorizationMiddleware(request, null, next);
    checkErrorStatus('Invalid token: missing data (user id is missing).');

    request.get = header => `Bearer ${loginToken(null, user.id)}`;
    authorizationMiddleware(request, null, next);
    checkErrorStatus('Invalid token: missing data (username is missing).');
  });

  test('The authorizationMiddleware function calls next() with no error object and sets the user attribute of the request object when token is valid', () => {
    const request = { get: header => `Bearer ${token}` };
    authorizationMiddleware(request, null, next);

    expect(nextCalled).toBe(true);
    expect(nextCalledWithError).toBe(false);
    expect(request).toHaveProperty('user');
    expect(request.user.username).toEqual(user.username);
    expect(request.user.id).toBe(user.id);
  });

  test('The setUserMiddleware function calls next() with an error object when a token is provided but is not valid', () => {
    const request = { get: header => `Bearer xxx${token}` };
    setUserMiddleware(request, null, next);
    checkErrorStatus('invalid token');

    request.get = header => `Bearer xxx${token}yyy`;
    setUserMiddleware(request, null, next);
    checkErrorStatus('invalid token');

    request.get = header => `Bearer ${token}yyy`;
    setUserMiddleware(request, null, next);
    checkErrorStatus('invalid signature');

    const charInToken = token[Math.floor(token.length / 4)];
    const anotherCharInToken = token[Math.floor(token.length / 3)];
    request.get = header => `Bearer ${token.replace(charInToken, anotherCharInToken)}`;
    setUserMiddleware(request, null, next);
    checkErrorStatus('invalid token');
  });

  test('The setUserMiddleware function sets the publicUser attribute on the request object and calls next() without an error object when no valid authorization header is found', () => {
    const request = { get: () => null };
    setUserMiddleware(request, null, next);
    expect(nextCalled).toBe(true);
    expect(nextCalledWithError).toBe(false);
    expect(request).toHaveProperty('publicUser');
    expect(request.publicUser).toBe(true);
  });

  test('The setUserMiddleware function sets the user attribute on the request object and calls next() without an error object when a valid authorization header is provided', () => {
    const request = { get: header => `Bearer ${token}` };
    setUserMiddleware(request, null, next);
    expect(nextCalled).toBe(true);
    expect(nextCalledWithError).toBe(false);
    expect(request).toHaveProperty('user');
    expect(request.user.username).toEqual(user.username);
    expect(request.user.id).toEqual(user.id);
  });
});
