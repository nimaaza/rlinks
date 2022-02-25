const form = document.querySelector('#form-url');

form.addEventListener('submit', event => {
  event.preventDefault();

  const url = document.querySelector('#input-url').value;
  const linkDisplay = document.querySelector('#created-link');

  fetch('/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
    .then(response => response.json())
    .then(data => {
      const link = `http://localhost:3000/${data.shortKey}`;
      const displayString = `Your shortened link is: <a href=${link}>${link}</a> and ${data.count} have created this link.`;
      linkDisplay.innerHTML = displayString;
    });
});
