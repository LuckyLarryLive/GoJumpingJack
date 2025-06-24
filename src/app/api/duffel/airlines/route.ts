import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

// Force Node.js runtime for JWT and crypto operations
export const runtime = 'nodejs';

function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  return createClient(supabaseUrl, serviceKey);
}

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Middleware to verify authentication (supports both cookies and headers)
async function verifyAuth(request: Request) {
  try {
    // Try cookie-based auth first
    const { getAuthToken } = await import('@/lib/auth');
    const cookieToken = await getAuthToken();

    if (cookieToken) {
      return verifyToken(cookieToken);
    }

    // Fallback to Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      return verifyToken(token);
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServiceClient();

    // Optional: Verify authentication
    // const user = await verifyAuth(request);
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('airline_cache')
      .select('*')
      .single();

    if (!cacheError && cachedData) {
      const cacheAge = Date.now() - new Date(cachedData.updated_at).getTime();
      if (cacheAge < CACHE_DURATION) {
        return NextResponse.json({ airlines: cachedData.data });
      }
    }

    // Fetch from Duffel API
    const response = await fetch('https://api.duffel.com/air/airlines', {
      headers: {
        Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch airlines from Duffel');
    }

    const data = await response.json();
    const airlines = data.data.map((airline: any) => ({
      name: airline.name,
      iataCode: airline.iata_code,
    }));

    // Update cache
    await supabase.from('airline_cache').upsert({
      id: 1, // We only need one cache entry
      data: airlines,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ airlines });
  } catch (error) {
    console.error('Get airlines error:', error);
    return NextResponse.json({ error: 'Failed to fetch airlines' }, { status: 500 });
  }
}
