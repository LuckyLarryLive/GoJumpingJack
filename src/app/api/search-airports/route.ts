import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim().toLowerCase() || ''

  if (!query) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
      .from('airports')
      .select('name, municipality, iata_code')
      .or(`municipality.ilike.%${query}%,name.ilike.%${query}%,iata_code.ilike.%${query}%`)
      .not('iata_code', 'is', null)
      .neq('iata_code', '')
      .limit(10);


    console.log({ query, data, error });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
