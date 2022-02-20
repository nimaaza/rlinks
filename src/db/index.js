const { Sequelize, DataTypes } = require('sequelize');
const {
  DB_HOST,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_LOGGER,
} = require('../../config');

const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'postgres',
  logging: DB_LOGGER,
});

const Link = sequelize.define(
  'Link',
  {
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: 'urlShortKeyCompositeIndex',
    },
    shortKey: {
      type: DataTypes.STRING(7),
      allowNull: false,
      unique: 'urlShortKeyCompositeIndex',
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['url'],
      },
    ],
  }
);

module.exports = { sequelize, Link };
