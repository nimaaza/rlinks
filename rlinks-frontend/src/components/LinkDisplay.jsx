import React from 'react';

const BASE_URI = process.env.REACT_APP_BACKEND_URI;

const LinkDisplay = ({ shortKey, count }) => {
  const link = `${BASE_URI}/${shortKey}`;

  return (
    <p>
      Your shortened link is: <a href={link}>{link}</a> and {count} people have
      created this link.
    </p>
  );
};

export default LinkDisplay;
