import React, { useState } from 'react';

import './App.css';
import LinkDisplay from './components/LinkDisplay';
import { fetchShortLinkFor } from './helpers';

const App = () => {
  const [url, setUrl] = useState('');
  const [display, setDisplay] = useState(null);

  const onSubmit = async e => {
    e.preventDefault();

    const data = await fetchShortLinkFor(url);
    setDisplay(data);
  };

  return (
    <React.Fragment>
      <form onSubmit={onSubmit}>
        <label htmlFor="url">URL: </label>
        <input
          type="text"
          name="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <input type="submit" />
      </form>
      {display && <LinkDisplay {...display} />}
    </React.Fragment>
  );
};

export default App;
