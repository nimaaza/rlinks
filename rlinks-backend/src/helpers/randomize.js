const randomIntegerUpTo = n => Math.floor(Math.random() * n);

const randomAlphaNumbericString = n => {
  const alphaNumerics = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  for (let i = 0; i < n; i++) {
    const randomCharacter = alphaNumerics.charAt(randomIntegerUpTo(alphaNumerics.length));
    randomString += randomCharacter;
  }

  return randomString;
};

module.exports = { randomAlphaNumbericString };
