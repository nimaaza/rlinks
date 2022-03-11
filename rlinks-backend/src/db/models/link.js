const { DataTypes } = require('sequelize');

const { SHORT_KEY_LENGTH } = require('../../config');
const { getLinkPreviewData } = require('../../helpers/previews');
const { randomAlphaNumbericString } = require('../../helpers/randomize');
const { validUrl } = require('../../helpers/url');

const addLinkModel = sequelize => {
  const Link = sequelize.define(
    'Link',
    {
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: 'urlShortKeyCompositeIndex',
      },
      shortKey: {
        type: DataTypes.STRING(SHORT_KEY_LENGTH),
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
        { unique: true, fields: ['url'] },
        {
          name: 'id_index',
          fields: [
            'id',
            {
              name: 'id',
              order: 'DESC',
            },
          ],
        },
      ],
    }
  );

  Link.transformer = async url => {
    if (!validUrl(url)) return;

    const existingUrl = await Link.findOne({ where: { url } });

    if (existingUrl) {
      await existingUrl.increment({ count: 1 });
      return existingUrl.dataValues;
    } else {
      const shortKey = randomAlphaNumbericString(SHORT_KEY_LENGTH);
      const { title, description, image } = await getLinkPreviewData(url);
      const createdLink = await Link.create({ url, shortKey, title, description, image });
      return createdLink.dataValues;
    }
  };

  return Link;
};

module.exports = addLinkModel;
