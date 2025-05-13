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
    // Update search terms to be more specific for city images
    searchQuery += ' downtown skyline cityscape urban landscape';

    console.log('[get-unsplash-image] Constructed search query:', searchQuery);

    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&orientation=landscape&per_page=5&content_filter=high`;
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
    
    // Log search results summary with more details
    console.log('[get-unsplash-image] Unsplash search results:', {
      query: searchQuery,
      total: data.total,
      total_pages: data.total_pages,
      results_count: data.results?.length || 0,
      first_few_results: data.results?.slice(0, 3).map((photo: any) => ({
        id: photo.id,
        description: photo.description || photo.alt_description || 'No description',
        tags: photo.tags?.map((tag: any) => tag.title) || [],
        location: photo.location ? {
          city: photo.location.city,
          country: photo.location.country
        } : 'No location'
      }))
    });

    // If no results found, return a "no image" response
    if (!data.results || data.results.length === 0) {
      console.log('[get-unsplash-image] No images found for query:', searchQuery);
      return NextResponse.json({
        imageUrl: null,
        error: 'No images found',
        details: `No images found for query: ${searchQuery}`
      });
    }

    // Get the first (best matching) result
    const photo = data.results[0];
    
    // Enhanced logging for selected photo
    console.log('[get-unsplash-image] Selected photo details:', {
      id: photo.id,
      description: photo.description || photo.alt_description || 'No description available',
      tags: photo.tags?.map((tag: any) => ({
        title: tag.title,
        type: tag.type
      })) || [],
      location: photo.location ? {
        city: photo.location.city,
        country: photo.location.country,
        name: photo.location.name,
        position: photo.location.position
      } : 'No location data',
      relevance: {
        hasCityMatch: photo.description?.toLowerCase().includes(city_name.toLowerCase()) || 
                     photo.alt_description?.toLowerCase().includes(city_name.toLowerCase()) || 
                     photo.location?.city?.toLowerCase().includes(city_name.toLowerCase()),
        hasCountryMatch: photo.location?.country?.toLowerCase().includes(country_code?.toLowerCase() || ''),
        hasRegionMatch: region ? photo.location?.name?.toLowerCase().includes(region.toLowerCase()) : false,
        matchDetails: {
          descriptionMatch: photo.description?.toLowerCase().includes(city_name.toLowerCase()) || false,
          altDescriptionMatch: photo.alt_description?.toLowerCase().includes(city_name.toLowerCase()) || false,
          locationMatch: photo.location?.city?.toLowerCase().includes(city_name.toLowerCase()) || false,
          tagMatches: photo.tags?.filter((tag: any) => 
            tag.title.toLowerCase().includes(city_name.toLowerCase()) ||
            tag.title.toLowerCase().includes(country_code?.toLowerCase() || '')
          ).map((tag: any) => tag.title) || []
        }
      }
    });

    return NextResponse.json({
      imageUrl: photo.urls.regular,
      downloadLocationUrl: photo.links.download_location,
      photographerName: photo.user.name,
      photographerProfileUrl: `${photo.user.links.html}${UNSPLASH_UTM}`,
      unsplashUrl: `https://unsplash.com/${UNSPLASH_UTM}`,
      imageDetails: {
        description: photo.description || photo.alt_description,
        location: photo.location,
        tags: photo.tags?.map((tag: any) => tag.title)
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