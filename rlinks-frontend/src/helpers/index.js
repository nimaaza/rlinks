const fetchShortLinkFor = url => doFetch('shorten', { url });

const fetchNextPage = (mode, cursor) => doFetch('links', { mode, cursor });

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
