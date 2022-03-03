import React from 'react';
import styled from 'styled-components';

import Button from './styled/Button';
import { Column, Row } from './styled/Container';
import CircleImage from './styled/CircleImage';

const BASE_URI = process.env.REACT_APP_BACKEND_URI;

const copyToClipboard = async text => {
  await navigator.clipboard.writeText(text);
};

const VerticalLine = styled.div`
  border: 1px solid #0000003d;
  margin: 0px 16px;
`;

const CustomRow = styled(Row)`
  justify-content: space-around;
`;

const CustomColumn = styled(Column)`
  justify-content: space-between;
  width: 100%;
`;

const CenteredRow = styled(Row)`
  align-items: center;
  justify-content: center;
`;

const CenteredColumn = styled(Column)`
  align-items: center;
  width: 100%;
`;

const Card = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  border: 1px solid #0000003d;
  border-radius: 16px;
  padding: 16px;
  margin: 32px auto;
  box-shadow: 0px 0px 4px #0000003d;

  p,
  h1,
  h2 {
    margin: 0px;
  }

  a {
    text-decoration: none;
  }
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
    <Card>
      <div>
        <CircleImage src={image} alt="" />
      </div>
      <VerticalLine />
      <CustomColumn>
        <a href={link}>
          <h2>{title}</h2>
        </a>
        <p>{description ? description : 'No description.'}</p>
        <CustomRow>
          <CenteredColumn>
            <h2>{count}</h2>
            <p>creation</p>
          </CenteredColumn>
          <CenteredColumn>
            <h2>{visits}</h2>
            <p>visits</p>
          </CenteredColumn>
        </CustomRow>
        <CenteredRow>
          {/* <a href={link}>{link}</a> */}
          <Button onClick={() => copyToClipboard(link)}>
            {link} (click to copy)
          </Button>
        </CenteredRow>
      </CustomColumn>
    </Card>
  );
};

export default LinkDisplay;
