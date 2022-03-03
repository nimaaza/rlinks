import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin: auto 500px;
  min-width: 750px;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
`;

export { Container, Row, Column };
