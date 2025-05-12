import { NextRequest, NextResponse } from 'next/server';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function POST(req: NextRequest) {
  try {
    const { downloadLocationUrl } = await req.json();
    if (!downloadLocationUrl) {
      return NextResponse.json({ error: 'No downloadLocationUrl provided' }, { status: 400 });
    }
    const res = await fetch(downloadLocationUrl, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Unsplash download tracking failed' }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 