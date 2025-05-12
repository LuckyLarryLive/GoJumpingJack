import { NextRequest, NextResponse } from 'next/server';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_UTM = '?utm_source=gojumpingjack&utm_medium=referral';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');
  const region = searchParams.get('region');
  const country = searchParams.get('country');

  let query = city || region || country;
  if (!query) {
    return NextResponse.json({ error: 'No location provided' }, { status: 400 });
  }

  try {
    const unsplashRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });
    if (!unsplashRes.ok) {
      return NextResponse.json({ error: 'Unsplash API error' }, { status: 502 });
    }
    const data = await unsplashRes.json();
    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ error: 'No image found' }, { status: 404 });
    }
    const photo = data.results[0];
    const imageUrl = photo.urls.regular;
    const downloadLocationUrl = photo.links.download_location;
    const photographerName = photo.user.name;
    const photographerProfileUrl = photo.user.links.html + UNSPLASH_UTM;
    const unsplashUrl = photo.links.html + UNSPLASH_UTM;
    return NextResponse.json({ imageUrl, downloadLocationUrl, photographerName, photographerProfileUrl, unsplashUrl });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 