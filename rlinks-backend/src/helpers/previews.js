const { getLinkPreview } = require('link-preview-js');
const { ENV } = require('../config');

let getLinkPreviewData;

if (ENV === 'TEST') {
  getLinkPreviewData = async () => {
    return { title: '', description: '', image: '' };
  };
} else {
  getLinkPreviewData = async url => {
    const data = await getLinkPreview(url);

    const { title, description } = data;
    const image = data.images[0];

    return {
      title,
      description,
      image,
    };
  };
}

module.exports = { getLinkPreviewData };
