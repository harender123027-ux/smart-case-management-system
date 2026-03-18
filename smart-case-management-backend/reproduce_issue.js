const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3000/api';

async function reproduce() {
  try {
    console.log('--- Logging in ---');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'password'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Logged in. Token received.');

    console.log('\n--- Registering Complaint ---');
    const formData = new FormData();
    formData.append('complainant_name', 'Reproduction Test');
    formData.append('complainant_phone', '9999999999');
    formData.append('complainant_address', '123 Test St');
    formData.append('complaint_type', 'theft');
    formData.append('description', 'This is a reproduction test case.');
    formData.append('location', 'Test Location');
    formData.append('priority', 'high');
    formData.append('language', 'en');

    const config = {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    };

    const complaintRes = await axios.post(`${API_URL}/complaints`, formData, config);
    console.log('✅ Complaint registered successfully:', complaintRes.data.complaint_number);

  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
    }
  }
}

reproduce();
