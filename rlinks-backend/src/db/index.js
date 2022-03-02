const { Sequelize, DataTypes } = require('sequelize');

const {
  DB_HOST,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_LOGGER,
} = require('../../config');
const { validUrl } = require('../helpers/url');
const { getLinkPreviewData } = require('../helpers/previews');
const { randomAlphaNumbericString } = require('../helpers/randomize');

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
    title: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    visits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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

Link.transformer = async url => {
  if (!validUrl(url)) return;

  let shortKey, count, visits;
  const existingUrl = await Link.findOne({ where: { url } });

  if (existingUrl) {
    await existingUrl.increment({ count: 1 });
    shortKey = existingUrl.shortKey;
    count = existingUrl.count;
    visits = existingUrl.visits;
  } else {
    shortKey = randomAlphaNumbericString(7);
    const link = { url, shortKey };
    const createdLink = await Link.create(link);
    shortKey = createdLink.shortKey;
    count = createdLink.count;
    visits = createdLink.visits;
  }

  return { url, shortKey, count, visits };
};

const initDB = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
};

module.exports = { sequelize, Link, initDB };
