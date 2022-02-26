import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [url, setUrl] = useState('');
  const [display, setDisplay] = useState(null);

  const onSubmit = e => {
    e.preventDefault();

    fetch('/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then(response => response.json())
      .then(data => {
        setDisplay(data);
      });
  };

  return (
    <React.Fragment>
      <form onSubmit={onSubmit}>
        <label htmlFor='url'>URL: </label>
        <input
          type="text"
          name="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <input type="submit" />
      </form>
      {display && (
        <p>
          Your shortened link is:{' '}
          <a
            href={`http://localhost:3000/${display.shortKey}`}
          >{`http://localhost:3000/${display.shortKey}`}</a>{' '}
          and {display.count} people have created this link.
        </p>
      )}
    </React.Fragment>
  );
};

export default App;
