import { NextResponse } from 'next/server';
import { createOfferRequest, type FlightSearchParams } from '@/lib/duffel';

export async function POST(request: Request) {
  console.log('[initiate-search] Received request for initiate-search');
  try {
    const params: FlightSearchParams = await request.json();
    // Validate required fields (basic)
    if (!params.origin || !params.destination || !params.departureDate || !params.passengers || !params.cabinClass) {
      return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }
    console.log('[initiate-search] Calling duffel.offerRequests.create()');
    const offerRequestId = await createOfferRequest(params);
    console.log(`[initiate-search] duffel.offerRequests.create() returned, offer_request_id: ${offerRequestId}`);
    console.log('[initiate-search] Returning offer_request_id to client');
    return NextResponse.json({ offer_request_id: offerRequestId, status: 'pending' }, { status: 200 });
  } catch (error: any) {
    console.error('[initiate-search] Error:', error);
    return NextResponse.json({ message: error.message || 'Failed to initiate search' }, { status: 500 });
  }
} 