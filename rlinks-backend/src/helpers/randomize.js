const randomIntegerUpTo = n => Math.floor(Math.random() * n);

const randomAlphaNumbericString = n => {
  const alphaNumerics = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const numberOfAcceptableCharacters = alphaNumerics.length;
  let randomString = '';

  for (let i = 0; i < n; i++) {
    const randomCharacter = alphaNumerics.charAt(randomIntegerUpTo(numberOfAcceptableCharacters));
    randomString += randomCharacter;
  }

  return randomString;
};

module.exports = { randomAlphaNumbericString };
