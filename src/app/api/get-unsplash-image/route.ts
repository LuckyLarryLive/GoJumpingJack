import { NextRequest, NextResponse } from 'next/server';

// Move the API key check to a constant at the top level
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_UTM = '?utm_source=gojumpingjack&utm_medium=referral';

// Helper function to check API key
function checkApiKey() {
  if (!UNSPLASH_ACCESS_KEY) {
    console.error('[get-unsplash-image] Missing UNSPLASH_ACCESS_KEY environment variable');
    return {
      error: true,
      response: NextResponse.json(
        { 
          error: 'Server configuration error: Missing Unsplash API key',
          details: 'The server is not properly configured to access the Unsplash API'
        },
        { status: 503 }
      )
    };
  }
  return { error: false };
}

export async function GET(request: Request) {
  try {
    // Log environment variables (without exposing the full key)
    console.log('[get-unsplash-image] Environment check:', {
      hasAccessKey: !!UNSPLASH_ACCESS_KEY,
      accessKeyPrefix: UNSPLASH_ACCESS_KEY ? `${UNSPLASH_ACCESS_KEY.substring(0, 4)}...` : 'missing'
    });

    // Check API key first
    const keyCheck = checkApiKey();
    if (keyCheck.error) {
      return keyCheck.response;
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
        { 
          error: 'Missing required city_name parameter',
          details: 'The city_name parameter is required to search for images'
        },
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

      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Unsplash API authentication failed',
            details: 'The server is not properly configured to access the Unsplash API'
          },
          { status: 503 }
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          { 
            error: 'Unsplash API rate limit exceeded',
            details: 'The server has exceeded its rate limit for the Unsplash API'
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          error: `Unsplash API error: ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[get-unsplash-image] Unsplash API response:', {
      id: data.id,
      description: data.description || data.alt_description || 'No description available',
      tags: data.tags?.map((tag: any) => ({
        title: tag.title,
        type: tag.type
      })) || [],
      location: data.location ? {
        city: data.location.city,
        country: data.location.country,
        name: data.location.name,
        position: data.location.position
      } : 'No location data',
      urls: {
        raw: data.urls.raw,
        full: data.urls.full,
        regular: data.urls.regular,
        small: data.urls.small
      },
      user: {
        name: data.user.name,
        username: data.user.username,
        portfolio_url: data.user.portfolio_url
      },
      links: {
        html: data.links.html,
        download: data.links.download,
        download_location: data.links.download_location
      },
      searchQuery: searchQuery,
      relevance: {
        hasCityMatch: data.description?.toLowerCase().includes(city_name.toLowerCase()) || 
                     data.alt_description?.toLowerCase().includes(city_name.toLowerCase()) || 
                     data.location?.city?.toLowerCase().includes(city_name.toLowerCase()),
        hasCountryMatch: data.location?.country?.toLowerCase().includes(country_code?.toLowerCase() || ''),
        hasRegionMatch: region ? data.location?.name?.toLowerCase().includes(region.toLowerCase()) : false
      }
    });

    return NextResponse.json({
      imageUrl: data.urls.regular,
      downloadLocationUrl: data.links.download_location,
      photographerName: data.user.name,
      photographerProfileUrl: `${data.user.links.html}${UNSPLASH_UTM}`,
      unsplashUrl: `https://unsplash.com/${UNSPLASH_UTM}`,
      imageDetails: {
        description: data.description || data.alt_description,
        location: data.location,
        tags: data.tags?.map((tag: any) => tag.title)
      }
    });
  } catch (error) {
    console.error('[get-unsplash-image] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 