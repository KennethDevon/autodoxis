// Quick test script to test login endpoint
const fetch = require('node-fetch');

const API_URL = process.argv[2] || 'https://autodoxis-production.up.railway.app';
const email = 'kennethdevon2004@gmail.com';
const password = 'admin123';

console.log(`Testing login to: ${API_URL}`);
console.log(`Email: ${email}`);
console.log(`Password: ${password}\n`);

fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
})
.then(res => res.json())
.then(data => {
  console.log('Response status:', data);
  if (data.requiresVerification) {
    console.log('✅ Login successful - email verification required');
    console.log('   User ID:', data.userId);
    console.log('   Email:', data.email);
  } else if (data.user) {
    console.log('✅ Login successful');
    console.log('   User:', data.user);
  } else {
    console.log('❌ Login failed:', data.message);
  }
})
.catch(err => {
  console.error('❌ Error:', err.message);
});

