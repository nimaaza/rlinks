const addLinkModel = require('./link');
const addUserModel = require('./user');

const initializeModels = sequelize => {
  const Link = addLinkModel(sequelize);
  const User = addUserModel(sequelize);

  User.hasMany(Link);
  Link.belongsTo(User, {
    foreignKey: { allowNull: false },
  });

  return { Link, User };
};

module.exports = initializeModels;
