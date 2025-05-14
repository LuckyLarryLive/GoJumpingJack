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

    const queries = [
      `${city_name} ${region ? region + ' ' : ''}skyline`,
      `${city_name} ${region ? region + ' ' : ''}cityscape`,
      `${city_name} ${region ? region + ' ' : ''}landmark`,
      `${city_name} ${country_code ? country_code + ' ' : ''}city`,
      city_name // Plain city name as the broadest query
    ].filter(q => q.trim() !== ""); // Filter out potentially empty queries if region/country_code are null

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
      console.log('[get-unsplash-image] No suitable photo found after all queries and fallbacks. Returning 200 with null imageUrl.');
      return NextResponse.json({ 
        imageUrl: null,
        message: 'No suitable city-specific image found after trying all queries and fallbacks.',
        photographerName: null,
        photographerProfileUrl: null,
        unsplashUrl: null,
        downloadLocationUrl: null
      }, { status: 200 });
    }

    console.log(`[get-unsplash-image] Final selected photo: id=${finalSelectedPhoto.id}, score=${finalScore}. Reason: ${selectionReason}`);
    
    // Return the image URL and attribution
    return NextResponse.json({
        imageUrl: finalSelectedPhoto.urls.regular,
        downloadLocationUrl: finalSelectedPhoto.links.download_location,
        photographerName: finalSelectedPhoto.user.name,
        photographerProfileUrl: finalSelectedPhoto.user.links.html,
        unsplashUrl: finalSelectedPhoto.links.html,
        message: `Image successfully fetched. ${selectionReason}`
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