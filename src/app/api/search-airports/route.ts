import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim().toLowerCase() || '';

  if (!query) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('airports')
    .select('airport_code, airport_name, city_code, city_name')
    .or(`airport_code.ilike.%${query}%,airport_name.ilike.%${query}%,city_code.ilike.%${query}%,city_name.ilike.%${query}%`)
    .eq('flightable', true)
    .limit(10);

  if (error) {
    console.error("Supabase query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
