const randomIntegerUpTo = n => Math.floor(Math.random() * n);

const randomAlphaNumbericString = length => {
  const alphaNumerics = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomCharacter = alphaNumerics.charAt(randomIntegerUpTo(alphaNumerics.length));
    randomString += randomCharacter;
  }

  return randomString;
};

module.exports = { randomAlphaNumbericString };
