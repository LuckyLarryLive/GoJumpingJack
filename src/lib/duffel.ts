import { Duffel } from '@duffel/api';

// Mode switch: 'live' or 'test' (default to 'test')
const mode = process.env.DUFFEL_MODE || 'test';
const duffelToken =
  mode === 'live'
    ? process.env.DUFFEL_LIVE_TOKEN
    : process.env.DUFFEL_TEST_TOKEN;

if (!duffelToken) {
  throw new Error('Duffel API token is not defined in environment variables');
}

// Initialize the Duffel client (Duffel-Version will be set via DUFFEL_VERSION env variable)
const duffel = new Duffel({
  token: duffelToken,
});

// Types for our flight search
export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  after?: string;
  sort?: 'total_amount' | 'total_duration' | '-total_amount' | '-total_duration';
  limit?: number;
}

// Duffel API types
interface TimeRange {
  from: string;
  to: string;
}

interface OfferRequestSlice {
  origin: string;
  destination: string;
  departure_date: string;
  arrival_time: TimeRange;
  departure_time: TimeRange;
}

// Function to search for flights
export async function searchFlights(params: FlightSearchParams) {
  try {
    console.log('Duffel searchFlights: Starting search with params:', params);
    
    // Simplify time range to reduce complexity
    const timeRange: TimeRange = {
      from: '06:00',
      to: '22:00',
    };

    // Create a timeout promise that rejects after 10 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 10000)
    );

    console.log('Duffel searchFlights: Creating offer request...');
    let offerRequest;
    try {
      offerRequest = await Promise.race([
        duffel.offerRequests.create({
          slices: [
            {
              origin: params.origin,
              destination: params.destination,
              departure_date: params.departureDate,
              arrival_time: timeRange,
              departure_time: timeRange,
            },
            ...(params.returnDate
              ? [
                  {
                    origin: params.destination,
                    destination: params.origin,
                    departure_date: params.returnDate,
                    arrival_time: timeRange,
                    departure_time: timeRange,
                  },
                ]
              : []),
          ],
          passengers: [
            ...Array(params.passengers.adults).fill({
              type: 'adult',
            }),
            ...Array(params.passengers.children || 0).fill({
              type: 'child',
            }),
            ...Array(params.passengers.infants || 0).fill({
              type: 'infant',
            }),
          ],
          cabin_class: params.cabinClass,
        }),
        timeoutPromise
      ]) as any;
      console.log('Duffel searchFlights: Offer request full response:', JSON.stringify(offerRequest, null, 2));
      console.log('Duffel searchFlights: Offer request created successfully:', offerRequest.data.id);
    } catch (offerRequestError) {
      console.error('Duffel searchFlights: Error creating offer request:', offerRequestError);
      throw offerRequestError;
    }
    
    console.log('Duffel searchFlights: Fetching offers...');
    const offers = await Promise.race([
      duffel.offers.list({
        offer_request_id: offerRequest.data.id,
        limit: params.limit || 15, // Default to 15 results per page
        sort: (params.sort || 'total_amount') as any, // Type assertion to allow negative sort values
        after: params.after, // Use cursor for pagination
      }),
      timeoutPromise
    ]) as any;
    
    console.log('Duffel searchFlights: Offers fetched successfully. Count:', offers.data.length);
    return {
      data: offers.data,
      meta: offers.meta, // Contains pagination cursors and total count
    };
  } catch (error: any) {
    console.error('Duffel searchFlights: Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      errors: error.errors,
      meta: error.meta,
      stack: error.stack
    });
    
    // Check for specific error types
    if (error.message?.includes('timed out')) {
      throw new Error('The flight search request timed out. Please try again with a simpler search or different dates.');
    } else if (error.status === 504) {
      throw new Error('The flight search request timed out. Please try again with different dates or airports.');
    } else if (error.status === 401) {
      throw new Error('Authentication error with flight search provider. Please contact support.');
    } else if (error.status === 429) {
      throw new Error('Too many requests. Please try again in a few minutes.');
    }
    
    throw error;
  }
}

// Function to get offer details
export async function getOfferDetails(offerId: string) {
  try {
    const offer = await duffel.offers.get(offerId);
    return offer.data;
  } catch (error) {
    console.error('Error getting offer details:', error);
    throw error;
  }
}

// Function to create an order (booking)
export async function createOrder(offerId: string, passengers: any[]) {
  try {
    const order = await duffel.orders.create({
      type: 'instant',
      selected_offers: [offerId],
      passengers,
    });
    return order.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// Helper: Create Offer Request (async flow)
export async function createOfferRequest(params: FlightSearchParams) {
  // (Reuse the offerRequests.create logic, but return only the offer_request_id)
  const timeRange: TimeRange = { from: '06:00', to: '22:00' };
  const offerRequest = await duffel.offerRequests.create({
    slices: [
      {
        origin: params.origin,
        destination: params.destination,
        departure_date: params.departureDate,
        arrival_time: timeRange,
        departure_time: timeRange,
      },
      ...(params.returnDate
        ? [{
            origin: params.destination,
            destination: params.origin,
            departure_date: params.returnDate,
            arrival_time: timeRange,
            departure_time: timeRange,
          }]
        : []),
    ],
    passengers: [
      ...Array(params.passengers.adults).fill({ type: 'adult' }),
      ...Array(params.passengers.children || 0).fill({ type: 'child' }),
      ...Array(params.passengers.infants || 0).fill({ type: 'infant' }),
    ],
    cabin_class: params.cabinClass,
  });
  console.log('Duffel createOfferRequest: Offer request full response:', JSON.stringify(offerRequest, null, 2));
  return offerRequest.data.id;
}

// Helper: List Offers for an Offer Request (async flow)
export async function listOffers({ offerRequestId, sort = 'total_amount', limit = 15, after }: {
  offerRequestId: string;
  sort?: 'total_amount' | '-total_amount' | 'total_duration' | '-total_duration';
  limit?: number;
  after?: string;
}) {
  console.log('[listOffers] Called with:', { offerRequestId, sort, limit, after });
  if (!offerRequestId || typeof offerRequestId !== 'string') {
    throw new Error('Missing or invalid offerRequestId');
  }
  if (limit !== undefined && typeof limit !== 'number') {
    throw new Error('Invalid limit parameter');
  }
  // Only include defined properties
  const params: any = {
    offer_request_id: offerRequestId,
    limit,
  };
  if (after !== undefined) params.after = after;
  if (sort && typeof sort === 'string') params.sort = sort;
  console.log('[listOffers] Final params to duffel.offers.list:', params);
  try {
    return await duffel.offers.list(params);
  } catch (error: unknown) {
    console.error('[listOffers] Error from duffel.offers.list:', error);
    if (error instanceof Error) {
      console.error('[listOffers] Error stack:', error.stack);
    }
    throw error;
  }
} 