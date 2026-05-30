fetch('http://localhost:4005/api/v1/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-org-id': 'klb-connect' },
  body: JSON.stringify({ name: 'test_template2', category: 'MARKETING', content: 'hello' })
}).then(async res => {
  console.log(res.status, await res.text());
});
