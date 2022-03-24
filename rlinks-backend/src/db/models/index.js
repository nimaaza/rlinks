const addLinkModel = require('./link');
const addUserModel = require('./user');

const initializeModels = sequelize => {
  const Link = addLinkModel(sequelize);
  const User = addUserModel(sequelize);
  return { Link, User };
};

module.exports = initializeModels;
