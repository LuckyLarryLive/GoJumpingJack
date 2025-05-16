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
    console.log(`[API /api/search-airports] Attempting Supabase RPC for term: "${searchTerm}"`);
    const { data: airports, error } = await supabase
      .rpc('search_airports_with_region', { 
        search_query: searchTerm,
        search_city: true,  // Enable city name search
        search_airport: true,  // Enable airport name search
        search_code: true,  // Enable IATA code search
        fuzzy_match: true  // Enable fuzzy matching
      });

    if (error) {
      console.error('[API /api/search-airports] Supabase RPC error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort results to prioritize exact matches
    const sortedAirports = (airports || []).sort((a: any, b: any) => {
      const aExactMatch = a.city_name?.toLowerCase() === searchTerm.toLowerCase() || 
                         a.name?.toLowerCase() === searchTerm.toLowerCase();
      const bExactMatch = b.city_name?.toLowerCase() === searchTerm.toLowerCase() || 
                         b.name?.toLowerCase() === searchTerm.toLowerCase();
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      return 0;
    });

    console.log(`[API /api/search-airports] Supabase RPC successful. Found ${sortedAirports.length} airports.`);
    return NextResponse.json(sortedAirports);
  } catch (err: any) {
    console.error('[API /api/search-airports] UNEXPECTED CATCH BLOCK ERROR:', err);
    console.error('[API /api/search-airports] Error stack:', err.stack);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
