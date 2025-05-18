import { NextResponse } from 'next/server';
import { listOffers } from '@/lib/duffel';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offerRequestId = searchParams.get('offer_request_id');
    const sort = searchParams.get('sort') as any;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 15;
    const after = searchParams.get('after') || undefined;

    if (!offerRequestId) {
      console.error('[results] Missing offer_request_id');
      return NextResponse.json({ message: 'Missing offer_request_id' }, { status: 400 });
    }

    console.log('[results] Received offer_request_id:', offerRequestId);
    console.log('[results] Calling listOffers with:', { offerRequestId, sort, limit, after });
    let offersResponse;
    try {
      offersResponse = await listOffers({
        offerRequestId,
        sort,
        limit,
        after,
      });
    } catch (duffelError: any) {
      console.error('[results] Duffel API error:', duffelError);
      return NextResponse.json({ message: duffelError.message || 'Duffel API error', details: duffelError }, { status: 502 });
    }
    console.log('[results] Duffel offers.list response:', offersResponse);

    // If offers are not ready, Duffel may return an empty array
    const offers = offersResponse.data || [];
    const meta = offersResponse.meta || {};
    // If no offers yet, return pending status
    if (!offers.length) {
      return NextResponse.json({ status: 'pending', offers: [], meta }, { status: 200 });
    }
    // Otherwise, return offers and pagination info
    return NextResponse.json({ status: 'complete', offers, meta }, { status: 200 });
  } catch (error: any) {
    console.error('[results] Error:', error);
    return NextResponse.json({ message: error.message || 'Failed to fetch results' }, { status: 500 });
  }
} 