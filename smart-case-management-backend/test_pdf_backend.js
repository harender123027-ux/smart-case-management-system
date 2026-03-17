const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  try {
    // 1. Login to get token
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'officer1',
      password: 'password'
    });
    const token = loginRes.data.token;
    console.log('Login successful.');

    // 2. Prepare multipart request
    console.log('Sending PDF for analysis...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream('c:/Users/cctns/Documents/test_complaint.pdf'));

    const res = await axios.post('http://localhost:3000/api/ai/analyze-pdf', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    // Note: I will update ai.js to use gemini-flash-latest if this works.
    // But for this test, I need to modify ai.js first.

    console.log('Analysis Result:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('Error Response:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

test();
