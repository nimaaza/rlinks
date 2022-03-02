import React, { useEffect, useState } from 'react';
import { fetchNextPage } from '../helpers';

const BASE_URI = process.env.REACT_APP_BACKEND_URI;

const Links = () => {
  const [links, setLinks] = useState([]);
  const [hasNext, setHasNext] = useState(true);
  const [after, setAfter] = useState(0);

  const loadNextPage = async () => {
    if (!hasNext) return;

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      const nextLinks = await fetchNextPage(after);
      const newLinks = links.concat(nextLinks.links);

      setLinks(newLinks);
      setHasNext(nextLinks.hasNext);
      setAfter(nextLinks.after);
    }
  };

  useEffect(async () => {
    const nextLinks = await fetchNextPage();
    setLinks(nextLinks.links);
    setHasNext(nextLinks.hasNext);
    setAfter(nextLinks.after);
  }, []);

  return (
    <div onWheel={loadNextPage}>
      {links.map(link => (
        <div key={link.id}>
          <p>
            <a href={`${BASE_URI}/${link.shortKey}`}>{`${BASE_URI}/${link.shortKey}`}</a>
            created {link.count} times
          </p>
        </div>
      ))}
      {after && <button onClick={loadNextPage}>load more</button>}
    </div>
  );
};

export default Links;
