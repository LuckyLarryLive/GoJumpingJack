require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DUFFEL_TOKEN = process.env.DUFFEL_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchAllDuffelAirports() {
  let airports = [];
  let after = null;
  let page = 1;
  const limit = 100;

  while (true) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (after) params.append('after', after);

    const response = await axios.get(
      `https://api.duffel.com/air/airports?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${DUFFEL_TOKEN}`,
          'Accept-Encoding': 'gzip,deflate,compress',
        },
      }
    );

    const data = response.data.data;
    airports = airports.concat(data);

    if (response.data.meta && response.data.meta.after) {
      after = response.data.meta.after;
      page++;
      console.log(`Fetched page ${page}, total airports: ${airports.length}`);
    } else {
      break;
    }
  }
  return airports;
}

function mapDuffelToSupabase(airport) {
  return {
    duffel_id: airport.id,
    iata_code: airport.iata_code,
    name: airport.name,
    city_name: airport.city_name,
    country_code: airport.country_code,
    latitude: airport.latitude,
    longitude: airport.longitude,
    updated_at: new Date().toISOString(),
  };
}

async function upsertAirports(airports) {
  const chunkSize = 500;
  for (let i = 0; i < airports.length; i += chunkSize) {
    const chunk = airports.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('airports')
      .upsert(chunk, { onConflict: ['iata_code'] });
    if (error) {
      console.error('Upsert error:', error);
    } else {
      console.log(`Upserted ${chunk.length} airports`);
    }
  }
}

(async () => {
  try {
    console.log('Fetching airports from Duffel...');
    const duffelAirports = await fetchAllDuffelAirports();
    console.log(`Fetched ${duffelAirports.length} airports from Duffel.`);

    const mapped = duffelAirports.map(mapDuffelToSupabase);
    await upsertAirports(mapped);

    console.log('Sync complete!');
  } catch (err) {
    console.error('Error during sync:', err);
  }
})(); 