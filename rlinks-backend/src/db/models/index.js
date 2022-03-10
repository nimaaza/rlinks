const addLinkModel = require('./link');

const initializeModels = sequelize => {
  return { Link: addLinkModel(sequelize) };
};

module.exports = initializeModels;
