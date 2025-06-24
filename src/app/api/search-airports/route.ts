import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const start = Date.now();
  logger.apiRequest('GET', '/api/search-airports');

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  logger.debug('Environment check', {
    hasSupabaseUrl: !!SUPABASE_URL,
    hasSupabaseKey: !!SUPABASE_ANON_KEY,
    component: 'search-airports',
  });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.error('Missing Supabase credentials', undefined, { component: 'search-airports' });
    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase credentials.' },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  logger.debug('Supabase client initialized', { component: 'search-airports' });

  const { searchParams } = new URL(req.url);
  const searchTerm = searchParams.get('q');

  logger.info('Airport search request', {
    searchTerm,
    component: 'search-airports',
  });

  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length < 2) {
    logger.debug('Search term too short or invalid', {
      searchTerm,
      component: 'search-airports',
    });
    const duration = Date.now() - start;
    logger.apiResponse('GET', '/api/search-airports', 200, duration);
    return NextResponse.json([]);
  }

  try {
    logger.debug('Executing Supabase query', {
      searchTerm,
      component: 'search-airports',
    });

    const { data: airports, error } = await supabase
      .from('airports')
      .select('*')
      .or(
        `iata_code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,city_name.ilike.%${searchTerm}%`
      )
      .limit(10);

    if (error) {
      logger.error('Supabase query failed', error as Error, {
        searchTerm,
        component: 'search-airports',
      });
      const duration = Date.now() - start;
      logger.apiResponse('GET', '/api/search-airports', 500, duration);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    // Sort results to prioritize exact matches
    const sortedAirports = (airports || []).sort((a: any, b: any) => {
      const aExactMatch =
        a.city_name?.toLowerCase() === searchTerm.toLowerCase() ||
        a.name?.toLowerCase() === searchTerm.toLowerCase() ||
        a.iata_code?.toLowerCase() === searchTerm.toLowerCase();
      const bExactMatch =
        b.city_name?.toLowerCase() === searchTerm.toLowerCase() ||
        b.name?.toLowerCase() === searchTerm.toLowerCase() ||
        b.iata_code?.toLowerCase() === searchTerm.toLowerCase();
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      return 0;
    });

    logger.info('Airport search completed', {
      searchTerm,
      resultCount: sortedAirports.length,
      component: 'search-airports',
    });

    const duration = Date.now() - start;
    logger.apiResponse('GET', '/api/search-airports', 200, duration);

    return NextResponse.json(sortedAirports);
  } catch (err: any) {
    const duration = Date.now() - start;
    logger.error('Unexpected error in airport search', err, {
      searchTerm,
      component: 'search-airports',
    });
    logger.apiResponse('GET', '/api/search-airports', 500, duration);

    return NextResponse.json(
      {
        error: err.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
