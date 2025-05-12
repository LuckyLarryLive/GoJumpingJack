import { NextRequest, NextResponse } from 'next/server';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_UTM = '?utm_source=gojumpingjack&utm_medium=referral';

export async function GET(request: Request) {
  try {
    // Log environment variables (without exposing the full key)
    console.log('[get-unsplash-image] Environment check:', {
      hasAccessKey: !!UNSPLASH_ACCESS_KEY,
      accessKeyPrefix: UNSPLASH_ACCESS_KEY ? `${UNSPLASH_ACCESS_KEY.substring(0, 4)}...` : 'missing'
    });

    if (!UNSPLASH_ACCESS_KEY) {
      console.error('[get-unsplash-image] Missing UNSPLASH_ACCESS_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Unsplash API key' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const city_name = searchParams.get('city_name');
    const country_code = searchParams.get('country_code');
    const region = searchParams.get('region');

    console.log('[get-unsplash-image] Received parameters:', {
      city_name,
      country_code,
      region
    });

    if (!city_name) {
      console.error('[get-unsplash-image] Missing required city_name parameter');
      return NextResponse.json(
        { error: 'Missing required city_name parameter' },
        { status: 400 }
      );
    }

    // Construct search query with fallbacks
    let searchQuery = city_name;
    if (region) {
      searchQuery += ` ${region}`;
    }
    if (country_code) {
      searchQuery += ` ${country_code}`;
    }
    searchQuery += ' cityscape landscape';

    console.log('[get-unsplash-image] Constructed search query:', searchQuery);

    const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchQuery)}&orientation=landscape`;
    const headers = {
      'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      'Accept-Version': 'v1'
    };

    console.log('[get-unsplash-image] Making request to Unsplash:', {
      url: unsplashUrl,
      headers: {
        ...headers,
        'Authorization': 'Client-ID [REDACTED]' // Log headers without exposing the key
      }
    });

    const response = await fetch(unsplashUrl, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[get-unsplash-image] Unsplash API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      return NextResponse.json(
        { error: `Unsplash API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[get-unsplash-image] Unsplash API response:', {
      id: data.id,
      urls: data.urls,
      user: data.user,
      links: data.links
    });

    return NextResponse.json({
      imageUrl: data.urls.regular,
      downloadLocationUrl: data.links.download_location,
      photographerName: data.user.name,
      photographerProfileUrl: `${data.user.links.html}${UNSPLASH_UTM}`,
      unsplashUrl: `https://unsplash.com/${UNSPLASH_UTM}`
    });
  } catch (error) {
    console.error('[get-unsplash-image] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 