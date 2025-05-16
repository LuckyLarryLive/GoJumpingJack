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

// Initialize the Duffel client
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
      from: '06:00',  // More reasonable time range
      to: '22:00',    // More reasonable time range
    };

    console.log('Duffel searchFlights: Creating offer request...');
    const offerRequest = await Promise.race([
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
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Offer request creation timed out')), 15000)
      )
    ]) as any; // Type assertion for offerRequest
    
    console.log('Duffel searchFlights: Offer request created successfully:', offerRequest.data.id);

    console.log('Duffel searchFlights: Fetching offers...');
    const offers = await Promise.race([
      duffel.offers.list({
        offer_request_id: offerRequest.data.id,
        limit: 100, // Increased limit to get more results for better sorting/filtering
        sort: 'total_amount', // Ensure we get the cheapest flights first
        after: params.after, // Support pagination through all results
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Offers fetch timed out')), 15000)
      )
    ]) as any; // Type assertion for offers
    
    console.log('Duffel searchFlights: Offers fetched successfully. Count:', offers.data.length);
    return {
      data: offers.data,
      meta: offers.meta, // Include pagination metadata
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
      throw new Error('The flight search request timed out. Please try again with a simpler search.');
    } else if (error.status === 504) {
      throw new Error('The flight search request timed out. Please try again.');
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