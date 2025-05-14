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
        html: string;
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

    // Helper function to fetch and score photos
    const fetchAndScorePhotos = async (query: string): Promise<{ photo: UnsplashPhoto; score: number } | null> => {
      console.log('[get-unsplash-image] Trying query:', query);
      
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5&content_filter=high`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      if (!response.ok) {
        console.error('[get-unsplash-image] Unsplash API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log('[get-unsplash-image] Results for query:', query, {
        total: data.total,
        total_pages: data.total_pages,
        results_count: data.results.length
      });

      // Log details of first few results before scoring
      console.log('[get-unsplash-image] First 3 results for query ' + query + ':', data.results.slice(0, 3).map((photo: UnsplashPhoto) => ({
        id: photo.id,
        description: photo.description || photo.alt_description,
        tags: photo.tags?.map((tag: { title: string }) => tag.title).join(', '),
        location: {
          title: photo.location?.title,
          city: photo.location?.city,
          country: photo.location?.country
        }
      })));

      if (!data.results || data.results.length === 0) {
        console.log(`[get-unsplash-image] No results from Unsplash for query '${query}'.`);
        return null;
      }

      // Score each photo
      const scoredPhotos = data.results.map((photo: UnsplashPhoto) => {
        let score = 0;
        const cityNameLower = city_name.toLowerCase(); // city_name is from GET params

        console.log(`[get-unsplash-image] Scoring photo ${photo.id} for city: '${cityNameLower}' (Query: '${query}')`);
        const photoLocationCityLower = photo.location?.city?.toLowerCase();
        const photoLocationTitleLower = photo.location?.title?.toLowerCase();
        const photoTagsLower = photo.tags?.map(tag => tag.title.toLowerCase()) || [];

        console.log(`  Photo details: id=${photo.id}, locCity='${photoLocationCityLower}', locTitle='${photoLocationTitleLower}', tags='${photoTagsLower.join(', ')}'`);

        // Priority 1: Exact match on location.city
        if (photoLocationCityLower === cityNameLower) {
          score += 20;
          console.log(`  [+] Score +20 (exact city match in location.city) for ${photo.id}`);
        } 
        // Priority 2: location.city includes city_name (e.g., "Tampa Bay" for "Tampa")
        else if (photoLocationCityLower && photoLocationCityLower.includes(cityNameLower)) {
          score += 10; // Less than exact, but still good
          console.log(`  [+] Score +10 (location.city '${photoLocationCityLower}' includes '${cityNameLower}') for ${photo.id}`);
        } else {
            if (photo.location?.city === undefined) console.log(`  [-] location.city is undefined.`);
            else if (photo.location?.city === null) console.log(`  [-] location.city is null.`);
            else console.log(`  [-] No match or include for location.city ('${photoLocationCityLower}') with '${cityNameLower}'`);
        }

        // Priority 3: location.title includes city_name
        if (photoLocationTitleLower && photoLocationTitleLower.includes(cityNameLower)) {
          score += 15;
          console.log(`  [+] Score +15 (location.title '${photoLocationTitleLower}' includes '${cityNameLower}') for ${photo.id}`);
        } else {
            if (photo.location?.title === undefined) console.log(`  [-] location.title is undefined.`);
            else if (photo.location?.title === null) console.log(`  [-] location.title is null.`);
            else console.log(`  [-] No include for location.title ('${photoLocationTitleLower}') with '${cityNameLower}'`);
        }
        
        // Priority 4: Tags include city_name
        const hasCityTag = photoTagsLower.some(tagTitle => tagTitle.includes(cityNameLower));
        if (hasCityTag) {
          score += 15;
          console.log(`  [+] Score +15 (tags include '${cityNameLower}') for ${photo.id}`);
        } else {
            if (!photo.tags || photo.tags.length === 0) console.log(`  [-] No tags present or tags array is empty.`);
            else console.log(`  [-] No tag includes '${cityNameLower}'. Tags: ${photoTagsLower.join(', ')}`);
        }

        console.log(`  Photo ${photo.id} final score for city '${cityNameLower}': ${score}`);
        return { photo, score };
      });

      // Sort by score
      scoredPhotos.sort((a: { photo: UnsplashPhoto; score: number }, b: { photo: UnsplashPhoto; score: number }) => b.score - a.score);

      if (scoredPhotos.length > 0) {
          const topScoredPhoto = scoredPhotos[0];
          console.log(`[get-unsplash-image] Top scored photo for query '${query}': id=${topScoredPhoto.photo.id}, score=${topScoredPhoto.score}, locCity='${topScoredPhoto.photo.location?.city}', locTitle='${topScoredPhoto.photo.location?.title}'`);
          if (topScoredPhoto.score >= 15) {
              console.log(`[get-unsplash-image] Photo ${topScoredPhoto.photo.id} meets score threshold (>=15) for query '${query}'. Selecting this photo.`);
              return topScoredPhoto;
          } else {
              console.log(`[get-unsplash-image] Top photo ${topScoredPhoto.photo.id} for query '${query}' did not meet score threshold of 15 (score: ${topScoredPhoto.score}).`);
              return null;
          }
      } else {
          // This case should ideally not be reached if data.results had items,
          // but as a fallback if scoredPhotos array ends up empty for some reason.
          console.log(`[get-unsplash-image] No photos were scored for query '${query}'.`);
          return null;
      }
    };

    // Try queries in sequence
    const queries = [
      `${city_name} ${region ? region + ' ' : ''}skyline`,
      `${city_name} ${region ? region + ' ' : ''}cityscape`,
      `${city_name} ${region ? region + ' ' : ''}landmark`,
      `${city_name} ${country_code} city`,
      city_name
    ];

    let selectedPhoto: UnsplashPhoto | null = null;
    let bestScore = 0;

    for (const query of queries) {
      const result = await fetchAndScorePhotos(query);
      if (result && result.score > bestScore) {
        selectedPhoto = result.photo;
        bestScore = result.score;
        console.log(`[get-unsplash-image] Found suitable photo with score ${result.score} for query: ${query}`);
        break; // Stop if we found a good match
      }
    }

    if (!selectedPhoto) {
      console.log('[get-unsplash-image] No suitable city-specific photos found after trying all queries');
      return NextResponse.json({ 
        error: 'No city-specific images found',
        details: 'Could not find any images specifically matching the requested city'
      }, { status: 404 });
    }

    // Log the selected photo details
    console.log('[get-unsplash-image] Selected photo:', {
      id: selectedPhoto.id,
      score: bestScore,
      description: selectedPhoto.description || selectedPhoto.alt_description,
      tags: selectedPhoto.tags?.map((tag: { title: string }) => tag.title).join(', '),
      location: {
        title: selectedPhoto.location?.title,
        city: selectedPhoto.location?.city,
        country: selectedPhoto.location?.country
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