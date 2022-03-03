import React, { useEffect, useState } from 'react';

import { fetchNextPage } from '../helpers';
import LinkDisplay from './LinkDisplay';
import Button from './styled/Button';

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
    <div onWheel={loadNextPage} onScroll={loadNextPage}>
      { links.map(link => <LinkDisplay key={link.id} {...link} />)}
      {after
        ? <Button onClick={loadNextPage}>load more</Button>
        :<p>no more links to load</p>}
    </div>
  );
};

export default Links;
