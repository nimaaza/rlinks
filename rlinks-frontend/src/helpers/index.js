const fetchShortLinkFor = url => doFetch('shorten', { url });

const fetchNextPage = id => doFetch('links', { id });

const doFetch = (endpoint, data) => {
  return fetch(`/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(data => data);
};

export { fetchShortLinkFor, fetchNextPage };
