import styled from 'styled-components';

const Button = styled.button`
  height: 40px;
  width: 100%;
  margin: 8px 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #0000003d;
  box-shadow: 0px 0px 4px #0000003d;

  :hover {
    border: 1px solid #00000069;
    box-shadow: 0px 0px 4px #0000069;
  }

  :active {
    background-color: #0000001f;
  }
`;

export default Button;
