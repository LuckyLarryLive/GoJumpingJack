import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim().toLowerCase() || '';

  if (!query) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('airports')
    .select(`
      iata_code,
      name,
      city_name,
      country_code,
      airport_regions(region)
    `)
    .or(`name.ilike.%${query}%,city_name.ilike.%${query}%,iata_code.ilike.%${query}%`)
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten region for easier use in frontend
  const results = data.map(a => ({
    ...a,
    region: a.airport_regions?.[0]?.region || null
  }));

  return NextResponse.json(results);
}
