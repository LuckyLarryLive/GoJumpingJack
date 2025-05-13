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

interface UnsplashPhoto {
    id: string;
    description: string | null;
    alt_description: string | null;
    tags: Array<{ title: string }>;
    location: { title: string | null } | null;
    urls: { regular: string };
    links: {
        download_location: string;
        html: string;
    };
    user: {
        name: string;
        links: {
            html: string;
        };
    };
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

    // Construct the search query
    const searchQuery = `${city_name} ${region ? region + ' ' : ''}${country_code} downtown skyline cityscape urban landscape`;
    console.log('[get-unsplash-image] Constructed search query:', searchQuery);

    // Make the request to Unsplash API
    const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&orientation=landscape&per_page=5&content_filter=high`,
        {
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        }
    );

    if (!response.ok) {
        console.error('[get-unsplash-image] Unsplash API error:', response.status, response.statusText);
        return NextResponse.json({ error: 'Failed to fetch image from Unsplash' }, { status: response.status });
    }

    const data = await response.json();
    console.log('[get-unsplash-image] Unsplash API response:', {
        total: data.total,
        total_pages: data.total_pages,
        results_count: data.results.length
    });

    // Log details of first few results
    console.log('[get-unsplash-image] First 3 results:', data.results.slice(0, 3).map((photo: UnsplashPhoto) => ({
        id: photo.id,
        description: photo.description || photo.alt_description,
        tags: photo.tags?.map((tag: { title: string }) => tag.title).join(', '),
        location: photo.location?.title
    })));

    if (!data.results || data.results.length === 0) {
        console.log('[get-unsplash-image] No images found for query:', searchQuery);
        return NextResponse.json({ error: 'No images found' }, { status: 404 });
    }

    // Select the first result
    const selectedPhoto: UnsplashPhoto = data.results[0];
    console.log('[get-unsplash-image] Selected photo:', {
        id: selectedPhoto.id,
        description: selectedPhoto.description || selectedPhoto.alt_description,
        tags: selectedPhoto.tags?.map((tag: { title: string }) => tag.title).join(', '),
        location: selectedPhoto.location?.title,
        relevance: {
            has_city: selectedPhoto.description?.toLowerCase().includes(city_name.toLowerCase()) || 
                     selectedPhoto.alt_description?.toLowerCase().includes(city_name.toLowerCase()),
            has_country: country_code ? (selectedPhoto.description?.toLowerCase().includes(country_code.toLowerCase()) || 
                        selectedPhoto.alt_description?.toLowerCase().includes(country_code.toLowerCase())) : false,
            has_region: region ? (selectedPhoto.description?.toLowerCase().includes(region.toLowerCase()) || 
                                selectedPhoto.alt_description?.toLowerCase().includes(region.toLowerCase())) : false
        }
    });

    // Return the image URL and attribution
    return NextResponse.json({
        imageUrl: selectedPhoto.urls.regular,
        downloadLocationUrl: selectedPhoto.links.download_location,
        photographerName: selectedPhoto.user.name,
        photographerProfileUrl: selectedPhoto.user.links.html,
        unsplashUrl: selectedPhoto.links.html
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