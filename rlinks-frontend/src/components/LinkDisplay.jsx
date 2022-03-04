import React from 'react';
import styled from 'styled-components';

import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import CircleImage from './styled/CircleImage';

const BASE_URI = process.env.REACT_APP_BACKEND_URI;

const copyToClipboard = async text => {
  await navigator.clipboard.writeText(text);
};

const RowWithBorder = styled(Row)`
  box-shadow: 0px 0px 4px #0000003d;
  border-radius: 16px;
`;

const LinkDisplay = ({
  shortKey,
  count,
  visits,
  title,
  description,
  image,
}) => {
  const link = `${BASE_URI}/${shortKey}`;

  return (
    <RowWithBorder className="m-5 p-4">
      <Col lg={3} className="d-flex align-items-center justify-content-center">
        <CircleImage src={image} alt="" />
      </Col>
      <Col lg={9}>
        <Row>
          <a href={link}>
            <h2 className="text-truncate">{title}</h2>
          </a>
        </Row>
        <Row>
          <p>{description}</p>
        </Row>
        <Row>
          <Col className="d-flex flex-column align-items-center">
            <strong>{count}</strong>
            <p>creations</p>
          </Col>
          <Col className="d-flex flex-column align-items-center">
            <strong>{visits}</strong>
            <p>visits</p>
          </Col>
        </Row>
        <Row>
          <Button onClick={() => copyToClipboard(link)}>
            {link} (click to copy)
          </Button>
        </Row>
      </Col>
    </RowWithBorder>
  );
};

export default LinkDisplay;
