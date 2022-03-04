import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';

import { fetchNextPage } from '../helpers';
import LinkDisplay from './LinkDisplay';

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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const footerOption = () => {
    if (after) {
      return <Button onClick={loadNextPage}>load more</Button>;
    } else {
      return (
        <p>
          No more links to load, <a href='' onClick={scrollToTop}>create one?</a>
        </p>
      );
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
      {links.map(link => {
        return <LinkDisplay key={link.id} {...link} />;
      })}
      <div className="d-flex m-5 justify-content-center">{footerOption()}</div>
    </div>
  );
};

export default Links;
