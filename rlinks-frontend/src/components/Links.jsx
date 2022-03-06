import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';

import { fetchNextPage } from '../helpers';
import LinkDisplay from './LinkDisplay';

const Links = () => {
  const [links, setLinks] = useState([]);
  const [mode, setMode] = useState('id');
  const [hasNext, setHasNext] = useState(true);
  const [cursor, setCursor] = useState(0);

  useEffect(() => updateLinks(), [mode]);

  const updateLinks = async () => {
    const response = await fetchNextPage(mode, cursor);

    cursor > 0 ? setLinks(links.concat(response.links)) : setLinks(response.links);
    setHasNext(response.hasNext);
    setCursor(response.cursor);
  };

  const reachedBottom = () => window.innerHeight + window.scrollY >= document.body.offsetHeight;

  const loadNextPage = async () => {
    if (!hasNext) return;
    if (reachedBottom()) await updateLinks();
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const displayModeChange = async e => {
    const mode = e.target.value;
    setCursor(0);
    setMode(mode);
  };

  const footerOption = () => {
    // prettier-ignore
    return hasNext
      ? <Button onClick={loadNextPage}>load more</Button>
      : <p>No more links to load, <a href="#" onClick={scrollToTop}>create one?</a></p>;
  };

  return (
    <React.Fragment>
      <hr className="m-5" />
      <div className="d-flex justify-content-between m-5">
        <h1 className="text-muted">What others have been interested in:</h1>
        <select onChange={displayModeChange}>
          <option value={'id'}>Date of creation</option>
          <option value={'count'}>Most interest in</option>
          <option value={'visits'}>Most visits</option>
        </select>
      </div>
      <div onWheel={loadNextPage} onScroll={loadNextPage}>
        {links.map(link => (
          <LinkDisplay key={link.id} {...link} />
        ))}
      </div>
      <div className="d-flex m-5 justify-content-center">{footerOption()}</div>
    </React.Fragment>
  );
};

export default Links;
