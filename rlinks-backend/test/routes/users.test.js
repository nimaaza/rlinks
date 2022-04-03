const {
  User,
  constants: {
    SAMPLE_USERNAME,
    SAMPLE_PASSWORD,
    SAMPLE_PASSWORD_HASH,
    ANOTHER_SAMPLE_USERNAME,
    ANOTHER_SAMPLE_PASSWORD_HASH,
  },
  functions: { clearDataBase, doAxiosPost, doAxiosPatch, doAxiosDelete, loginToken },
} = require('../support');

describe('Tests for the users router', () => {
  const bcrypt = require('bcrypt');

  const newPassword = `{}|${SAMPLE_PASSWORD}//?!`;
  const unauthorizedAccessMessage = 'Unauthorized access.';

  beforeEach(async () => {
    await clearDataBase();
  });

  const testPasswordUpdateWithToken = async (param, success) => {
    const beforeUpdate = await User.create({ username: SAMPLE_USERNAME, hash: await SAMPLE_PASSWORD_HASH });
    const token = success
      ? loginToken(beforeUpdate.username, beforeUpdate.id)
      : `${loginToken(beforeUpdate.username, beforeUpdate.id)}invalid_token!`;
    const authorizationHeader = { Authorization: `Bearer ${token}` };
    const { data } = await doAxiosPatch(`users/${beforeUpdate[param]}`, { password: newPassword }, authorizationHeader);
    const afterUpdate = await User.findOne({ where: { username: SAMPLE_USERNAME } });

    expect(await bcrypt.compare(newPassword, afterUpdate.hash)).toBe(success);
    if (success) {
      expect(data).toHaveProperty('username');
      expect(data.username).toEqual(SAMPLE_USERNAME);
    } else {
      checkError(data, unauthorizedAccessMessage);
    }
  };

  const testPasswordUpdateWithoutToken = async param => {
    const userBeforeUpdate = await User.create({ username: SAMPLE_USERNAME, hash: await SAMPLE_PASSWORD_HASH });
    const { data } = await doAxiosPatch(`users/${userBeforeUpdate[param]}`, { password: newPassword });

    checkError(data, unauthorizedAccessMessage);
  };

  const testPasswordUpdateFromAnotherUser = async param => {
    const user = await User.create({
      username: SAMPLE_USERNAME,
      hash: await SAMPLE_PASSWORD_HASH,
    });
    const anotherUser = await User.create({
      username: ANOTHER_SAMPLE_USERNAME,
      hash: await ANOTHER_SAMPLE_PASSWORD_HASH,
    });
    const token = loginToken(user.username, user.id);
    const authorizationHeader = { Authorization: `Bearer ${token}` };
    const { data } = await doAxiosPatch(`users/${anotherUser[param]}`, { password: newPassword }, authorizationHeader);
    const anotherUserAfterUpdate = await User.findOne({ where: { id: anotherUser.id } });

    checkError(data, 'Unauthorized access.');
    expect(await bcrypt.compare(newPassword, anotherUserAfterUpdate.hash)).toBeFalsy();
  };

  const deleteWithToken = async (param, success) => {
    const user = await User.create({ username: SAMPLE_USERNAME, hash: await SAMPLE_PASSWORD_HASH });
    const countBefore = (await User.findAll({})).length;
    const token = success ? loginToken(user.username, user.id) : `${loginToken(user.username, user.id)}invalid_token!`;
    const authorizationHeader = { Authorization: `Bearer ${token}` };
    const { data } = await doAxiosDelete(`users/${user[param]}`, authorizationHeader);
    const countAfter = (await User.findAll({})).length;

    if (success) {
      expect(countAfter).toEqual(countBefore - 1);
    } else {
      expect(countAfter).toEqual(countBefore);
      checkError(data, unauthorizedAccessMessage);
    }
  };

  const deleteWithoutToken = async param => {
    const user = await User.create({ username: SAMPLE_USERNAME, hash: await SAMPLE_PASSWORD_HASH });
    const countBefore = (await User.findAll({})).length;
    const { data } = await doAxiosDelete(`users/${user[param]}`);
    const countAfter = (await User.findAll({})).length;

    expect(countAfter).toEqual(countBefore);
    checkError(data, unauthorizedAccessMessage);
  };

  const testDeleteAnotherUsername = async param => {
    const user = await User.create({
      username: SAMPLE_USERNAME,
      hash: await SAMPLE_PASSWORD_HASH,
    });
    const anotherUser = await User.create({
      username: ANOTHER_SAMPLE_USERNAME,
      hash: await ANOTHER_SAMPLE_PASSWORD_HASH,
    });
    const token = loginToken(user.username, user.id);
    const authorizationHeader = { Authorization: `Bearer ${token}` };
    const { data } = await doAxiosDelete(`/users/${anotherUser[param]}`, authorizationHeader);
    const anotherUserAfterDeleteAttempt = await User.findOne({ where: { id: anotherUser.id } });

    checkError(data, 'Unauthorized access.');
    expect(anotherUserAfterDeleteAttempt).toBeTruthy();
    expect(anotherUserAfterDeleteAttempt.username).toEqual(ANOTHER_SAMPLE_USERNAME);
  };

  const checkError = (data, message) => {
    expect(data).toHaveProperty('error');
    expect(data.error).toEqual(message);
  };

  test('POST /users with missing username will result in an error message', async () => {
    const noUsernameErrorMessage = 'Username missing.';

    let response = await doAxiosPost('/users', { username: '', password: SAMPLE_PASSWORD });
    checkError(response.data, noUsernameErrorMessage);

    response = await doAxiosPost('/users', { password: SAMPLE_PASSWORD });
    checkError(response.data, noUsernameErrorMessage);
  });

  test('POST /users with missing password will result in an error message', async () => {
    const noPasswordErrorMessage = 'Password missing.';

    let response = await doAxiosPost('/users', { username: SAMPLE_USERNAME, password: '' });
    checkError(response.data, noPasswordErrorMessage);

    response = await doAxiosPost('/users', { username: SAMPLE_USERNAME });
    checkError(response.data, noPasswordErrorMessage);
  });

  test(`POST /users with ${SAMPLE_USERNAME} and ${SAMPLE_PASSWORD} as password results in creation of the respective user in the database`, async () => {
    const userBeforePost = await User.findOne({ where: { username: SAMPLE_USERNAME } });
    const response = await doAxiosPost('users', { username: SAMPLE_USERNAME, password: SAMPLE_PASSWORD });
    const userAfterPost = await User.findOne({ where: { username: SAMPLE_USERNAME } });
    const { username } = response.data;

    expect(userBeforePost).toBeFalsy();
    expect(userAfterPost).toBeTruthy();
    expect(username).toEqual(SAMPLE_USERNAME);
    expect(userAfterPost.username).toEqual(SAMPLE_USERNAME);
    expect(await bcrypt.compare(SAMPLE_PASSWORD, userAfterPost.hash)).toBeTruthy();
  });

  test('POST /users with a used username results in an error message in response', async () => {
    await doAxiosPost('users', { username: SAMPLE_USERNAME, password: SAMPLE_PASSWORD });
    const response = await doAxiosPost('users', { username: SAMPLE_USERNAME, password: SAMPLE_PASSWORD });
    const { error } = response.data;

    expect(error).toEqual('Username is already taken.');
  });

  test('PATCH /users/:id allows authorized users to change their password', async () => {
    await testPasswordUpdateWithToken('id', true);
  });

  test('PATCH /users/:username allows authorized users to change their password', async () => {
    await testPasswordUpdateWithToken('username', true);
  });

  test('PATCH /users/:id prevents unauthorized users (with invalid token) to change their password', async () => {
    await testPasswordUpdateWithToken('id', false);
  });

  test('PATCH /users/:username prevents unauthorized users (with invalid token) to change their password', async () => {
    await testPasswordUpdateWithToken('username', false);
  });

  test('PATCH /users/:id prevents unauthorized users (without providing a token) to change their password', async () => {
    await testPasswordUpdateWithoutToken('id');
  });

  test('PATCH /users/:username prevents unauthorized users (without providing a token) to change their password', async () => {
    await testPasswordUpdateWithoutToken('username');
  });

  test('PATCH /users/:id prevents users to change password of another user', async () => {
    await testPasswordUpdateFromAnotherUser('id');
  });

  test('PATCH /users/:username prevents users to change password of another user', async () => {
    await testPasswordUpdateFromAnotherUser('username');
  });

  test('DELETE /users/:id allows authorized user to delete their username', async () => {
    await deleteWithToken('id', true);
  });

  test('DELETE /users/:username allows authorized user to delete their username', async () => {
    await deleteWithToken('username', true);
  });

  test('DELETE /users/:id prevents unauthorized (with invalid token) user from deleting a username', async () => {
    await deleteWithToken('id', false);
  });

  test('DELETE /users/:id prevents unauthorized (without token) user from deleting a username', async () => {
    await deleteWithoutToken('id');
  });

  test('DELETE /users/:username prevents unauthorized (with invalid token) user from deleting a username', async () => {
    await deleteWithToken('username', false);
  });

  test('DELETE /users/:username prevents unauthorized (without token) user from deleting a username', async () => {
    await deleteWithoutToken('username');
  });

  test('DELETE /users/:id prevents users from deleting the username from another user', async () => {
    await testDeleteAnotherUsername('id');
  });

  test('DELETE /users/:username prevents users from deleting the username from another user', async () => {
    await testDeleteAnotherUsername('username');
  });
});
