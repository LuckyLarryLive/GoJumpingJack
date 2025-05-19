const axios = require('axios');

const DUFFEL_TOKEN = process.env.DUFFEL_TEST_TOKEN;
const OFFER_REQUEST_ID = 'orq_0000AwE5g5ekJ4FrASdMdK'; // Replace with your actual offer_request_id if needed

if (!DUFFEL_TOKEN) {
  console.error('DUFFEL_TEST_TOKEN environment variable is not set.');
  process.exit(1);
}

async function fetchOffers() {
  try {
    const response = await axios.get(
      `https://api.duffel.com/air/offers?offer_request_id=${OFFER_REQUEST_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${DUFFEL_TOKEN}`,
          'Duffel-Version': 'v1',
          'Accept-Encoding': 'gzip, deflate, compress',
        },
      }
    );
    console.log('Duffel API /air/offers response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('Duffel API error response:', JSON.stringify(error.response.data, null, 2));
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

fetchOffers(); 