import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { fetchShortLinkFor } from '../helpers';
import LinkDisplay from './LinkDisplay';

const UrlForm = () => {
  const [url, setUrl] = useState('');
  const [link, setLink] = useState(null);

  const onSubmit = async e => {
    e.preventDefault();

    if (!url.trim().length > 0) return;

    const response = await fetchShortLinkFor(url);
    setLink(response);
  };

  const displayNewLink = () => {
    if (link) {
      return (
        <React.Fragment>
          <p className="text-muted fw-bold m-5">Here's your newly created link:</p>
          <LinkDisplay {...link} />
        </React.Fragment>
      );
    }
  };

  return (
    <React.Fragment>
      <Form className="m-5" onSubmit={onSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>URL:</Form.Label>
          <Form.Control required type="text" placeholder="URL" onChange={e => setUrl(e.target.value)} />
          <Form.Text className="text-muted">Enter a valid URL to shorten.</Form.Text>
        </Form.Group>
        <Button type="submit">Shorten!</Button>
      </Form>
      {displayNewLink()}
    </React.Fragment>
  );
};

export default UrlForm;
