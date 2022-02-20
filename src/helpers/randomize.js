const randomIntUpTo = n => Math.floor(Math.random() * n);

const randomAlphaNumbericString = n => {
  const acceptableCharacters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = acceptableCharacters.length;
  let randomString = '';

  for (let i = 0; i < n; i++) {
    const randomCharacter = acceptableCharacters.charAt(randomIntUpTo(length));
    randomString += randomCharacter;
  }

  return randomString;
};

module.exports = {
  randomAlphaNumbericString,
};
