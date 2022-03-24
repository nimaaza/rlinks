const { DataTypes } = require('sequelize');

const addUserModel = sequelize => {
  const User = sequelize.define(
    'User',
    {
      username: {
        type: DataTypes.TEXT,
        unique: true,
        allowNull: false,
      },
      passwordHash: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    },
    {
      timestaps: true,
    }
  );

  return User;
};

module.exports = addUserModel;
