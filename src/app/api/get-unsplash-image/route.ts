import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // Import Supabase client

// Move the API key check to a constant at the top level
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_UTM = '?utm_source=gojumpingjack&utm_medium=referral';

// Supabase Environment Variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for backend operations

// Initialize Supabase client (do this once outside the handler if possible, or ensure it's memoized)
// For serverless functions, creating it per request is common but check Supabase docs for best practices.
let supabase: any;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
} else {
    console.warn('[get-unsplash-image] Supabase URL or Service Key is missing. Cache will be disabled.');
}

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

// Helper function to fetch and score photos for a GIVEN query
const fetchAndScorePhotos = async (
    currentQuery: string, 
    targetCityName: string, 
    targetRegion: string | null, 
    targetCountryCode: string | null
): Promise<ScoredPhoto | null> => {
  console.log(`[get-unsplash-image] Fetching & Scoring for query: "${currentQuery}", targetCity: "${targetCityName}"`);
  
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(currentQuery)}&orientation=landscape&per_page=5&content_filter=high`,
    {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    }
  );

  if (!response.ok) {
    console.error(`[get-unsplash-image] Unsplash API error for query "${currentQuery}":`, response.status, response.statusText);
    return null;
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    console.log(`[get-unsplash-image] No Unsplash results for query "${currentQuery}".`);
    return null;
  }

  console.log(`[get-unsplash-image] Results for query "${currentQuery}": ${data.results.length} photos.`);

  const targetCityNameLower = targetCityName.toLowerCase();
  const relevantDescKeywords = ["skyline", "cityscape", "downtown", "urban", "architecture", "landmark", "city view"];

  const scoredPhotos: ScoredPhoto[] = data.results.map((photo: UnsplashPhoto): ScoredPhoto => {
    let score = 0;
    const photoId = photo.id;

    console.log(`[get-unsplash-image] Scoring photo ${photoId} for query "${currentQuery}" (target: "${targetCityNameLower}")`);

    // A. Query Specificity Bonus
    if (currentQuery.includes("skyline")) score += 5;
    else if (currentQuery.includes("cityscape")) score += 4;
    else if (currentQuery.includes("landmark")) score += 3;
    else if (targetCountryCode && currentQuery.includes(targetCountryCode.toLowerCase()) && currentQuery.includes("city")) score += 2;
    else if (currentQuery === targetCityName) score += 1; // Base for plain city query
    if (score > 0) console.log(`  [+] Score +${score} (query specificity bonus)`);
    let currentTotalScore = score;

    // B. Location Matching
    const photoLocationCityLower = photo.location?.city?.toLowerCase();
    const photoLocationTitleLower = photo.location?.title?.toLowerCase();

    if (photoLocationCityLower === targetCityNameLower) {
      score += 10;
      console.log(`  [+] Score +10 (exact location.city match: '${photoLocationCityLower}')`);
    } else if (photoLocationCityLower && photoLocationCityLower.includes(targetCityNameLower)) {
      score += 5;
      console.log(`  [+] Score +5 (location.city '${photoLocationCityLower}' includes '${targetCityNameLower}')`);
    }
    if (photoLocationTitleLower && photoLocationTitleLower.includes(targetCityNameLower)) {
      score += 7;
      console.log(`  [+] Score +7 (location.title '${photoLocationTitleLower}' includes '${targetCityNameLower}')`);
    }
    if(score > currentTotalScore) console.log(`  Subtotal after location: ${score}`); currentTotalScore = score;

    // C. Tag Matching
    const photoTagsLower = photo.tags?.map(tag => tag.title.toLowerCase()) || [];
    if (photoTagsLower.some(tag => tag.includes(targetCityNameLower))) {
      score += 7;
      console.log(`  [+] Score +7 (tags include '${targetCityNameLower}')`);
    }
    if(score > currentTotalScore) console.log(`  Subtotal after tags: ${score}`); currentTotalScore = score;

    // D. Description Matching
    const descriptionText = (photo.description || photo.alt_description || "").toLowerCase();
    if (descriptionText.includes(targetCityNameLower)) {
      score += 5;
      console.log(`  [+] Score +5 (description includes '${targetCityNameLower}')`);
    }
    let descKeywordsFound = 0;
    for (const keyword of relevantDescKeywords) {
      if (descriptionText.includes(keyword)) {
        score += 1;
        descKeywordsFound++;
        console.log(`  [+] Score +1 (description includes keyword '${keyword}')`);
        if (descKeywordsFound >= 3) break; // Max +3 from generic keywords
      }
    }
    if(score > currentTotalScore) console.log(`  Subtotal after description: ${score}`); 
    
    console.log(`  Photo ${photoId} final score for query "${currentQuery}": ${score}`);
    return { photo, score };
  });

  // Sort by score and return the highest scoring photo for THIS query
  scoredPhotos.sort((a, b) => b.score - a.score);
  
  if (scoredPhotos.length > 0 && scoredPhotos[0].score > 0) {
    console.log(`[get-unsplash-image] Top photo for query "${currentQuery}" is ${scoredPhotos[0].photo.id} with score ${scoredPhotos[0].score}`);
    return scoredPhotos[0];
  }
  console.log(`[get-unsplash-image] No photo from query "${currentQuery}" achieved a positive score.`);
  return null;
};

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

    if (!city_name || !country_code) { // country_code also essential for cache key
        console.error('[get-unsplash-image] Missing required city_name or country_code parameter');
        return NextResponse.json(
            { error: 'Missing required city_name or country_code parameter' },
            { status: 400 }
        );
    }

    // A. Check Cache
    if (supabase) {
        console.log(`[get-unsplash-image] Checking cache for: city=${city_name}, country=${country_code}, region=${region}`);
        try {
            let query = supabase
                .from('city_images')
                .select('*')
                .eq('city_name', city_name)
                .eq('country_code', country_code);

            if (region) {
                query = query.eq('region', region);
            } else {
                query = query.is('region', null);
            }
            query = query.limit(1);

            const { data: cachedImageData, error: cacheError } = await query;

            if (cacheError) {
                console.error('[get-unsplash-image] Supabase cache read error:', cacheError);
                // Don't fail, just proceed to Unsplash fetch
            } else if (cachedImageData && cachedImageData.length > 0) {
                const cachedImage = cachedImageData[0];
                console.log('[get-unsplash-image] Cache hit! Returning cached image:', cachedImage.id);
                return NextResponse.json({
                    imageUrl: cachedImage.unsplash_regular_url,
                    downloadLocationUrl: cachedImage.download_location_url,
                    photographerName: cachedImage.photographer_name,
                    photographerProfileUrl: cachedImage.photographer_profile_url,
                    unsplashUrl: cachedImage.unsplash_page_url,
                    message: 'Image successfully fetched from cache.'
                }, { status: 200 });
            } else {
                console.log('[get-unsplash-image] Cache miss.');
            }
        } catch (e) {
            console.error('[get-unsplash-image] Exception during Supabase cache check:', e);
            // Proceed to Unsplash fetch
        }
    }

    // B. Fetch from Unsplash & Store (if not in cache or cache check failed)
    const queries = [
      `${city_name} ${region ? region + ' ' : ''}skyline`,
      `${city_name} ${region ? region + ' ' : ''}cityscape`,
      `${city_name} ${region ? region + ' ' : ''}landmark`,
      `${country_code ? city_name + ' ' + country_code + ' ' : city_name + ' ' }city`, // Added check for country_code
      city_name
    ].filter(q => q.trim() !== "");

    let bestPhotoOverall: UnsplashPhoto | null = null;
    let highestScoreOverall = -1; 
    let bestQueryForOverallPhoto: string | null = null;
    let bestFallbackPhoto: UnsplashPhoto | null = null;
    let highestFallbackScore = -1;

    for (const currentQuery of queries) {
      const topScoredResultForThisQuery = await fetchAndScorePhotos(currentQuery, city_name, region, country_code);
      if (topScoredResultForThisQuery) {
        console.log(`[get-unsplash-image] Main GET: Top result for query '${currentQuery}': score=${topScoredResultForThisQuery.score}, id=${topScoredResultForThisQuery.photo.id}`);

        // Check for primary selection (meets threshold and is best so far)
        if (topScoredResultForThisQuery.score >= 15 && topScoredResultForThisQuery.score > highestScoreOverall) {
          highestScoreOverall = topScoredResultForThisQuery.score;
          bestPhotoOverall = topScoredResultForThisQuery.photo;
          bestQueryForOverallPhoto = currentQuery;
          console.log(`  New best overall photo (score >= 15): id=${bestPhotoOverall.id}, score=${highestScoreOverall} from query '${bestQueryForOverallPhoto}'`);
        }

        // Track best photo from the plain city_name query for fallback
        // (Assuming city_name is the last and most generic query)
        if (currentQuery === city_name) { 
          if (topScoredResultForThisQuery.score > highestFallbackScore) {
             bestFallbackPhoto = topScoredResultForThisQuery.photo;
             highestFallbackScore = topScoredResultForThisQuery.score;
             console.log(`  Updated fallback photo: id=${bestFallbackPhoto?.id}, score=${highestFallbackScore} from query '${currentQuery}'`);
          }
        }
      }
    }

    let finalSelectedPhoto: UnsplashPhoto | null = null;
    let finalScore = 0;
    let selectionReason = "";

    if (bestPhotoOverall) {
      finalSelectedPhoto = bestPhotoOverall;
      finalScore = highestScoreOverall;
      selectionReason = `Primary selection: Score ${finalScore} >= 15 from query '${bestQueryForOverallPhoto}'.`;
    } else if (bestFallbackPhoto) {
      finalSelectedPhoto = bestFallbackPhoto;
      finalScore = highestFallbackScore;
      selectionReason = `Fallback selection: No photo scored >= 15. Using best from '${city_name}' query with score ${finalScore}.`;
      console.log(`[get-unsplash-image] No photo met score threshold. Using fallback: id=${finalSelectedPhoto?.id}, score=${finalScore}`);
    }

    if (!finalSelectedPhoto) {
      console.log('[get-unsplash-image] No suitable photo from Unsplash. Returning 200 with null imageUrl.');
      return NextResponse.json({ 
        imageUrl: null,
        message: 'No suitable city-specific image found after trying all queries and fallbacks.',
        photographerName: null,
        photographerProfileUrl: null,
        unsplashUrl: null,
        downloadLocationUrl: null
      }, { status: 200 });
    }

    console.log(`[get-unsplash-image] Final selected photo from Unsplash: id=${finalSelectedPhoto.id}, score=${finalScore}. Reason: ${selectionReason}`);
    
    // --- Trigger Unsplash Download Location Endpoint (Compliance) ---
    if (finalSelectedPhoto.links && finalSelectedPhoto.links.download_location) {
        console.log(`[get-unsplash-image] Triggering download_location for photo ID: ${finalSelectedPhoto.id}`);
        fetch(finalSelectedPhoto.links.download_location, { method: 'GET' })
            .then(response => {
                if (response.ok) {
                    console.log(`[get-unsplash-image] Successfully triggered download_location for Unsplash photo ID: ${finalSelectedPhoto.id}, status: ${response.status}`);
                } else {
                    console.warn(`[get-unsplash-image] Warning: Failed to trigger download_location for Unsplash photo ID: ${finalSelectedPhoto.id}, status: ${response.status}`);
                }
            })
            .catch(triggerError => {
                console.error(`[get-unsplash-image] Error triggering download_location for Unsplash photo ID ${finalSelectedPhoto.id}:`, triggerError);
            });
        // This is a fire-and-forget, so we don't await it or let its failure block caching/response.
    } else {
        console.warn(`[get-unsplash-image] No download_location link found for Unsplash photo ID: ${finalSelectedPhoto.id}`);
    }
    // --- End Trigger --- 

    // Store in Supabase Cache
    if (supabase) {
        console.log('[get-unsplash-image] Storing new image to cache...');
        try {
            const { error: insertError } = await supabase
                .from('city_images')
                .insert({
                    city_name: city_name, // Ensure city_name is not null here
                    country_code: country_code, // Ensure country_code is not null
                    region: region, // Can be null
                    unsplash_regular_url: finalSelectedPhoto.urls.regular,
                    photographer_name: finalSelectedPhoto.user.name,
                    photographer_profile_url: finalSelectedPhoto.user.links.html,
                    unsplash_page_url: finalSelectedPhoto.links.html,
                    download_location_url: finalSelectedPhoto.links.download_location
                    // last_fetched_at and created_at have defaults
                });
            if (insertError) {
                console.error('[get-unsplash-image] Supabase cache insert error:', insertError);
                // Log error but proceed with returning the image to the client
            } else {
                console.log('[get-unsplash-image] Successfully stored image in cache.');
            }
        } catch (e) {
            console.error('[get-unsplash-image] Exception during Supabase cache insert:', e);
        }
    }
    
    // Return the image URL and attribution (fetched from Unsplash)
    return NextResponse.json({
        imageUrl: finalSelectedPhoto.urls.regular,
        downloadLocationUrl: finalSelectedPhoto.links.download_location,
        photographerName: finalSelectedPhoto.user.name,
        photographerProfileUrl: finalSelectedPhoto.user.links.html,
        unsplashUrl: finalSelectedPhoto.links.html,
        message: `Image successfully fetched from Unsplash. ${selectionReason}`
    });

  } catch (error) {
    console.error('[get-unsplash-image] Unexpected error in GET:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 