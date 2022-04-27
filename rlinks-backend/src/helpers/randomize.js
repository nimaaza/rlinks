const randomIntegerUpTo = n => Math.floor(Math.random() * n);

const randomAlphaNumbericString = n => {
  const acceptableCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const numberOfAcceptableCharacters = acceptableCharacters.length;
  let randomString = '';

  for (let i = 0; i < n; i++) {
    const randomCharacter = acceptableCharacters.charAt(randomIntegerUpTo(numberOfAcceptableCharacters));
    randomString += randomCharacter;
  }

  return randomString;
};

module.exports = { randomAlphaNumbericString };
