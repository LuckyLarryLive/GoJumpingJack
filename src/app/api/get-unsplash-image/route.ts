import { NextRequest, NextResponse } from 'next/server';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_UTM = '?utm_source=gojumpingjack&utm_medium=referral';

export async function GET(request: Request) {
  try {
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

    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchQuery)}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[get-unsplash-image] Unsplash API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return NextResponse.json(
        { error: `Unsplash API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[get-unsplash-image] Unsplash API response:', {
      id: data.id,
      urls: data.urls,
      user: data.user
    });

    return NextResponse.json({
      imageUrl: data.urls.regular,
      downloadLocationUrl: data.links.download_location,
      photographerName: data.user.name,
      photographerProfileUrl: `${data.user.links.html}?utm_source=gojumpingjack&utm_medium=referral`,
      unsplashUrl: `https://unsplash.com/?utm_source=gojumpingjack&utm_medium=referral`
    });
  } catch (error) {
    console.error('[get-unsplash-image] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 