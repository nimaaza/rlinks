const { getLinkPreview } = require('link-preview-js');

const getLinkPreviewData = async url => {
  const data = await getLinkPreview(url);

  const { title, description } = data;
  const image = data.images[0];

  return {
    title,
    description,
    image,
  };
};

module.exports = { getLinkPreviewData };
