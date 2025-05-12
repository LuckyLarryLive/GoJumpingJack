import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('[API /api/search-airports] Function invoked.');

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[API /api/search-airports] Server configuration error: Missing Supabase credentials.');
    return NextResponse.json({ error: 'Server configuration error: Missing Supabase credentials.' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[API /api/search-airports] Supabase client initialized.');

  const { searchParams } = new URL(req.url);
  const searchTerm = searchParams.get('q');
  console.log(`[API /api/search-airports] Received search term: "${searchTerm}"`);

  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length < 2) {
    console.log('[API /api/search-airports] Search term too short or invalid. Returning empty array.');
    return NextResponse.json([]);
  }

  try {
    console.log(`[API /api/search-airports] Attempting Supabase query for term: "${searchTerm}"`);
    const { data, error } = await supabase
      .from('airports')
      .select(`
        iata_code,
        name,
        city_name,
        country_code,
        airport_regions!left(region)
      `)
      .or(`name.ilike.%${searchTerm}%,city_name.ilike.%${searchTerm}%,iata_code.ilike.%${searchTerm}%`)
      .limit(20);

    if (error) {
      console.error('[API /api/search-airports] Supabase query error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten region for easier use in frontend
    const airports = (data || []).map(a => ({
      ...a,
      region: a.airport_regions?.[0]?.region || null
    }));

    console.log(`[API /api/search-airports] Supabase query successful. Found ${airports.length} airports.`);
    return NextResponse.json(airports);
  } catch (err: any) {
    console.error('[API /api/search-airports] UNEXPECTED CATCH BLOCK ERROR:', err);
    console.error('[API /api/search-airports] Error stack:', err.stack);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
