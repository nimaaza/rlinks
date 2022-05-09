const randomIntegerUpTo = n => Math.floor(Math.random() * n);

const randomAlphaNumbericString = length => {
  const alphaNumerics = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  return Array.from({ length })
    .map(() => alphaNumerics.charAt(randomIntegerUpTo(alphaNumerics.length)))
    .join('');
};

module.exports = { randomAlphaNumbericString };
