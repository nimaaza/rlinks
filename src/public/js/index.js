const form = document.querySelector('#form-url');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const url = document.querySelector('#input-url').value;

  fetch('/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
    }),
  });
});
