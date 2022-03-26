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
      hash: {
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

  User.initializePublicUser = async () => {
    const user = await User.findOne({ where: { username: 'public' } });

    if (!user) {
      const publicUser = {
        username: 'public',
        hash: '',
      };

      await User.create(publicUser);
    }
  };

  return User;
};

module.exports = addUserModel;
