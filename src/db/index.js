const { Sequelize, DataTypes } = require('sequelize');

const {
  ENV,
  DB_HOST,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DB_LOGGER,
} = require('../../config');
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

Link.transformer = async url => {
  const validUrl =
    /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
      url
    );
  if (!validUrl) return;

  let shortKey;
  const existingUrl = await Link.findOne({ where: { url } });

  if (existingUrl) {
    await existingUrl.increment({ count: 1 });
    shortKey = existingUrl.shortKey;
  } else {
    shortKey = randomAlphaNumbericString(7);
    const link = { url, shortKey };
    const createdKey = await Link.create(link);
    shortKey = createdKey.shortKey;
  }

  return shortKey;
};

const initDB = async () => await sequelize.sync();

if (ENV !== 'TEST') {
  initDB();
}

module.exports = { sequelize, Link };
