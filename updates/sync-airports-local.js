// Load environment variables from .env file
require('dotenv').config();

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Retrieve environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DUFFEL_ACCESS_TOKEN = process.env.DUFFEL_ACCESS_TOKEN; // Ensure this matches your .env file

// --- Input Validation for Environment Variables ---
if (!SUPABASE_URL) {
  console.error("ERROR: SUPABASE_URL is not defined in your .env file.");
  process.exit(1); // Exit if critical env var is missing
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is not defined in your .env file.");
  process.exit(1);
}
if (!DUFFEL_ACCESS_TOKEN) {
  console.error("ERROR: DUFFEL_ACCESS_TOKEN is not defined in your .env file.");
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Helper Function: Fetch Airports from Duffel (Page by Page) ---
async function fetchAllDuffelAirports() {
  let allFetchedAirports = [];
  let afterCursor = null;
  const limitPerPage = 200; // Duffel's max limit per page
  let currentPage = 0;

  console.log('Starting to fetch airports from Duffel...');

  try {
    while (true) {
      currentPage++;
      const params = new URLSearchParams({ limit: limitPerPage.toString() });
      if (afterCursor) {
        params.append('after', afterCursor);
      }

      console.log(`Fetching Duffel airports: Page ${currentPage}, limit=${limitPerPage}, after=${afterCursor || 'N/A'}`);
      const response = await axios.get(
        `https://api.duffel.com/air/airports?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${DUFFEL_ACCESS_TOKEN}`,
            'Accept-Encoding': 'gzip, deflate, compress',
            'Duffel-Version': 'v1', // Recommended by Duffel
          },
          timeout: 30000, // 30 second timeout for API request
        }
      );

      const responseData = response.data;
      if (!responseData || !responseData.data) {
        console.error('Unexpected response structure from Duffel:', responseData);
        throw new Error('Unexpected response structure from Duffel API on page ' + currentPage);
      }
      
      allFetchedAirports = allFetchedAirports.concat(responseData.data);
      console.log(`Fetched ${responseData.data.length} airports this page. Total fetched so far: ${allFetchedAirports.length}`);

      if (responseData.meta && responseData.meta.after) {
        afterCursor = responseData.meta.after;
      } else {
        console.log('No more pages to fetch from Duffel.');
        break; 
      }
    }
    console.log(`Finished fetching from Duffel. Total airports retrieved: ${allFetchedAirports.length}`);
    return allFetchedAirports;
  } catch (error) {
    console.error('--- DUFFEL API ERROR ---');
    if (error.response) {
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Stack trace:', error.stack);
    throw new Error(`Failed to fetch airports from Duffel: ${error.message}`);
  }
}

// --- Helper Function: Map Duffel Airport Data to Supabase Schema ---
function mapDuffelToSupabase(duffelAirport) {
  return {
    // Ensure these field names match your Supabase 'airports' table columns
    duffel_id: duffelAirport.id,
    iata_code: duffelAirport.iata_code,
    name: duffelAirport.name,
    city_name: duffelAirport.city ? duffelAirport.city.name : null,
    country_code: duffelAirport.iata_country_code, // Or airport.city.iata_country_code if preferred
    latitude: duffelAirport.latitude,
    longitude: duffelAirport.longitude,
    time_zone: duffelAirport.time_zone,
    // created_at will be set by Supabase default, updated_at will be set here
    updated_at: new Date().toISOString(),
  };
}

// --- Helper Function: Upsert Airports to Supabase in Chunks ---
async function upsertAirportsToSupabase(airportsToUpsert) {
  const chunkSize = 100; // Adjust based on testing, 100-500 is usually fine
  console.log(`Starting to upsert ${airportsToUpsert.length} airports to Supabase in chunks of ${chunkSize}...`);
  
  for (let i = 0; i < airportsToUpsert.length; i += chunkSize) {
    const chunk = airportsToUpsert.slice(i, i + chunkSize);
    const currentChunkNumber = i / chunkSize + 1;
    console.log(`Upserting chunk ${currentChunkNumber} (records ${i + 1} to ${Math.min(i + chunkSize, airportsToUpsert.length)}), size: ${chunk.length}`);
    
    const { error } = await supabase
      .from('airports') // Make sure 'airports' is your table name
      .upsert(chunk, { 
        onConflict: 'iata_code', // IMPORTANT: Ensure 'iata_code' is unique and your conflict target
        ignoreDuplicates: false // Default is false, true would skip conflicting rows instead of updating
      }); 
      
    if (error) {
      console.error(`Supabase upsert error on chunk ${currentChunkNumber}:`, JSON.stringify(error, null, 2));
      // Decide if you want to stop on error or continue with other chunks
      // For a bulk import, you might want to log the error and continue, then review errors later.
      // throw new Error(`Supabase upsert failed: ${JSON.stringify(error)}`); // Uncomment to stop on first error
    } else {
      console.log(`Successfully upserted chunk ${currentChunkNumber} of ${chunk.length} airports.`);
    }
    // Optional: Add a small delay between chunks if you're hitting API rate limits (rare for Supabase inserts)
    // await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
  }
  console.log('Finished upserting airports to Supabase.');
}

// --- Main Execution Function ---
async function main() {
  console.log('--- Starting Airport Sync Script ---');
  try {
    const duffelAirports = await fetchAllDuffelAirports();
    
    if (!duffelAirports || duffelAirports.length === 0) {
      console.log('No airports fetched from Duffel or an error occurred during fetching. Exiting.');
      return;
    }

    console.log(`Mapping ${duffelAirports.length} airports to Supabase format...`);
    const mappedAirports = duffelAirports.map(mapDuffelToSupabase);

    await upsertAirportsToSupabase(mappedAirports);

    console.log('--- Airport Sync Script Completed Successfully! ---');
  } catch (err) {
    console.error('--- CRITICAL ERROR IN MAIN SCRIPT EXECUTION ---');
    console.error('Error message:', err.message);
    console.error('Stack trace:', err.stack);
    console.error('--- Airport Sync Script Failed! ---');
  }
}

// --- Run the main function ---
main();