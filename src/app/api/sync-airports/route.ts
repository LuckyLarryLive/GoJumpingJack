import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

export async function POST(req: NextRequest) {
  // 1. Secure with x-vercel-cron-secret header
  const secret = req.headers.get('x-vercel-cron-secret');
  if (!secret || secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // 2. Set up Supabase and Duffel
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const DUFFEL_TOKEN = process.env.DUFFEL_TOKEN!;

  // 3. Fetch all airports from Duffel (pagination)
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

  // 4. Map and upsert
  const mapped = airports.map((airport) => ({
    duffel_id: airport.id,
    iata_code: airport.iata_code,
    name: airport.name,
    city_name: airport.city_name,
    country_code: airport.country_code,
    latitude: airport.latitude,
    longitude: airport.longitude,
    updated_at: new Date().toISOString(),
  }));

  // Upsert in chunks
  const chunkSize = 500;
  for (let i = 0; i < mapped.length; i += chunkSize) {
    const chunk = mapped.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('airports')
      .upsert(chunk, { onConflict: 'iata_code' });
    if (error) {
      console.error('Upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Sync complete', count: mapped.length });
} 