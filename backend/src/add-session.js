const axios = require('axios');

async function addSession() {
  try {
    const response = await axios.post('http://localhost:4000/api/whatsapp/sessions', {
      name: '9108080161',
      sessionId: 'session-9108080161'
    });
    console.log('Session added successfully:', response.data);
  } catch (error) {
    console.error('Error adding session:', error.response ? error.response.data : error.message);
  }
}

addSession();
