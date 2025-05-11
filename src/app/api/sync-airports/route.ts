import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

async function fetchAllDuffelAirports(DUFFEL_TOKEN: string) {
  let airports: any[] = [];
  let after: string | null = null;
  const limit = 100;
  do {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (after) params.append('after', after);
    const response = await axios.get(
      `https://api.duffel.com/air/airports?${params.toString()}`,
      { headers: { Authorization: `Bearer ${DUFFEL_TOKEN}` } }
    );
    airports = airports.concat(response.data.data);
    after = response.data.meta?.after || null;
  } while (after);
  return airports;
}

function mapDuffelToSupabase(airport: any) {
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

async function upsertAirports(supabase: any, mapped: any[]) {
  const chunkSize = 500;
  for (let i = 0; i < mapped.length; i += chunkSize) {
    const chunk = mapped.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('airports')
      .upsert(chunk, { onConflict: 'iata_code' });
    if (error) {
      throw new Error(error.message);
    }
  }
}

export default async function handler(req: Request) {
  // Allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  // Secure with x-vercel-cron-secret header
  const secret = req.headers.get('x-vercel-cron-secret');
  if (!secret || secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Unauthorized cron attempt');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const DUFFEL_TOKEN = process.env.DUFFEL_TOKEN!;
    const duffelAirports = await fetchAllDuffelAirports(DUFFEL_TOKEN);
    const mapped = duffelAirports.map(mapDuffelToSupabase);
    await upsertAirports(supabase, mapped);
    return new Response(JSON.stringify({ message: 'Sync complete', count: mapped.length }), { status: 200 });
  } catch (err: any) {
    console.error('Error during sync:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
} 