import React from 'react';
import Container from 'react-bootstrap/Container';

import Links from './components/Links';
import UrlForm from './components/UrlForm';

const App = () => {
  return (
    <Container>
      <UrlForm />
      <Links />
    </Container>
  );
};

export default App;
