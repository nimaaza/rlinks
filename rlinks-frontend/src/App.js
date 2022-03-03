import React, { useState } from 'react';

import './App.css';
import LinkDisplay from './components/LinkDisplay';
import { Container } from './components/styled/Container';
import Links from './components/Links';
import { fetchShortLinkFor } from './helpers';

const App = () => {
  const [url, setUrl] = useState('');
  const [display, setDisplay] = useState(null);

  const onSubmit = async e => {
    e.preventDefault();

    if (!url.trim().length > 0) return;

    const data = await fetchShortLinkFor(url);
    setDisplay(data);
  };

  return (
    <Container>
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
      <Links />
    </Container>
  );
};

export default App;
