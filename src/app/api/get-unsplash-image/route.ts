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
    urls: {
        raw: string;
        full: string;
        regular: string;
        small: string;
        thumb: string;
    };
    links: {
        download_location: string;
    };
    user: {
        name: string;
        links: {
            html: string;
        };
    };
    tags: Array<{ title: string }>;
    location: {
        title: string | null;
        city: string | null;
        country: string | null;
    } | null;
}

interface ScoredPhoto {
    photo: UnsplashPhoto;
    score: number;
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
    const searchQuery = `${city_name} ${region ? region + ' ' : ''}${country_code} city downtown skyline urban architecture`;
    console.log('[get-unsplash-image] Constructed search query:', searchQuery);

    // Make the request to Unsplash API
    const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&orientation=landscape&per_page=10&content_filter=high`,
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
        location: {
            title: photo.location?.title,
            city: photo.location?.city,
            country: photo.location?.country
        },
        score: 0 // Will be calculated below
    })));

    if (!data.results || data.results.length === 0) {
        console.log('[get-unsplash-image] No images found for query:', searchQuery);
        return NextResponse.json({ error: 'No images found' }, { status: 404 });
    }

    // Score each photo based on relevance
    const relevantKeywords = ['skyline', 'urban', 'downtown', 'cityscape', 'architecture', 'building', 'night', 'day'];
    const cityNameLower = city_name.toLowerCase();
    
    const scoredPhotos = data.results.map((photo: UnsplashPhoto) => {
      let score = 0;
      const searchTerms = [cityNameLower, region?.toLowerCase(), country_code?.toLowerCase()].filter(Boolean);
      
      // STRICT LOCATION MATCHING - Highest Priority
      // Check for exact city match in location
      if (photo.location?.city?.toLowerCase() === cityNameLower) {
        score += 20; // Very high score for exact city match
        console.log(`[get-unsplash-image] Found exact city match in location.city for ${photo.id}`);
      }
      
      // Check for city name in location title
      if (photo.location?.title?.toLowerCase().includes(cityNameLower)) {
        score += 15; // High score for city name in location title
        console.log(`[get-unsplash-image] Found city name in location.title for ${photo.id}`);
      }
      
      // Check for city name in tags
      const hasCityTag = photo.tags?.some((tag: { title: string }) => 
        tag.title.toLowerCase().includes(cityNameLower)
      );
      if (hasCityTag) {
        score += 15; // High score for city name in tags
        console.log(`[get-unsplash-image] Found city name in tags for ${photo.id}`);
      }

      // SECONDARY CRITERIA - Only apply if we have a location match
      if (score > 0) {
        // Check for relevant keywords in description
        const description = (photo.description || photo.alt_description || '').toLowerCase();
        relevantKeywords.forEach(keyword => {
          if (description.includes(keyword)) score += 2;
        });
        
        // Check for relevant keywords in tags
        const tags = photo.tags?.map((tag: { title: string }) => tag.title.toLowerCase()) || [];
        relevantKeywords.forEach(keyword => {
          if (tags.some(tag => tag.includes(keyword))) score += 2;
        });

        // Country match bonus
        if (country_code && photo.location?.country?.toLowerCase() === country_code.toLowerCase()) {
          score += 3;
        }
      }

      // Penalize irrelevant photos (only if we have a location match)
      if (score > 0) {
        const description = (photo.description || photo.alt_description || '').toLowerCase();
        const tags = photo.tags?.map((tag: { title: string }) => tag.title.toLowerCase()) || [];
        
        if (description.includes('mountain') || description.includes('beach')) score -= 3;
        if (tags.some(tag => tag.includes('mountain') || tag.includes('beach'))) score -= 3;
      }

      return { photo, score };
    });

    // Sort by score and select the highest scoring photo
    scoredPhotos.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
    
    // Log the top 3 scored photos
    console.log('[get-unsplash-image] Top 3 scored photos:', scoredPhotos.slice(0, 3).map(({ photo, score }: { photo: UnsplashPhoto; score: number }) => ({
        id: photo.id,
        score,
        description: photo.description || photo.alt_description,
        tags: photo.tags?.map((tag: { title: string }) => tag.title).join(', '),
        location: {
            title: photo.location?.title,
            city: photo.location?.city,
            country: photo.location?.country
        }
    })));

    // Check if we have a photo with a strong location match (score >= 15)
    const bestMatch = scoredPhotos[0];
    if (!bestMatch || bestMatch.score < 15) {
      console.log('[get-unsplash-image] No suitable city-specific photos found');
      return NextResponse.json({ 
        error: 'No city-specific images found',
        details: 'Could not find any images specifically matching the requested city'
      }, { status: 404 });
    }

    const selectedPhoto = bestMatch.photo;

    // Log the selected photo details
    console.log('[get-unsplash-image] Selected photo:', {
      id: selectedPhoto.id,
      score: bestMatch.score,
      description: selectedPhoto.description || selectedPhoto.alt_description,
      tags: selectedPhoto.tags?.map((tag: { title: string }) => tag.title).join(', '),
      location: {
          title: selectedPhoto.location?.title,
          city: selectedPhoto.location?.city,
          country: selectedPhoto.location?.country
      },
      relevance: {
        cityMatch: selectedPhoto.location?.city?.toLowerCase() === cityNameLower,
        cityInTitle: selectedPhoto.location?.title?.toLowerCase().includes(cityNameLower),
        cityInTags: selectedPhoto.tags?.some((tag: { title: string }) => 
          tag.title.toLowerCase().includes(cityNameLower)
        ),
        countryMatch: country_code ? selectedPhoto.location?.country?.toLowerCase() === country_code.toLowerCase() : false,
        hasRelevantTags: selectedPhoto.tags?.some((tag: { title: string }) => 
          relevantKeywords.some((keyword: string) => tag.title.toLowerCase().includes(keyword))
        )
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