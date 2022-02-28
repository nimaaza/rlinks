const fetchShortLinkFor = url => {
  return fetch('/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
    .then(response => response.json())
    .then(data => data);
};

const fetchNextLinks = id => {
  let query;

  if (id) {
    query = { id };
  } else {
    query = {};
  }

  return fetch('/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  })
    .then(response => response.json())
    .then(data => data);
};

export { fetchShortLinkFor, fetchNextLinks };
