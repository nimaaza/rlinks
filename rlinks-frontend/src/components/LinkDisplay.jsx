import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import copy from 'copy-to-clipboard';

import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import CircleImage from './styled/CircleImage';

const BASE_URI = process.env.REACT_APP_BACKEND_URI;

const RowWithBorder = styled(Row)`
  box-shadow: 0px 0px 4px #0000003d;
  border-radius: 16px;
`;

const LinkDisplay = ({ shortKey, count, visits, title, description, image }) => {
  const link = `${BASE_URI}/${shortKey}`;

  const [btnClass, setBtnClass] = useState('btn btn-primary');

  useEffect(() => {
    setTimeout(() => setBtnClass('btn btn-primary'), 5000);
  }, [btnClass]);

  const copyToClipboard = async text => {
    copy(text) ? setBtnClass('btn btn-success') : setBtnClass('btn btn-danger');
  };

  const btnText = () => {
    if (btnClass.includes('primary')) {
      return `${link} (click to copy)`;
    } else if (btnClass.includes('success')) {
      return 'successfully copied!';
    } else if (btnClass.includes('danger')) {
      return 'failed to copy';
    }
  };

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
          <Button className={btnClass} onClick={() => copyToClipboard(link)}>
            {btnText()}
          </Button>
        </Row>
      </Col>
    </RowWithBorder>
  );
};

export default LinkDisplay;
