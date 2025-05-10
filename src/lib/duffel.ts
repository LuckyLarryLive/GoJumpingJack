import { Duffel } from '@duffel/api';

if (!process.env.DUFFEL_TOKEN) {
  throw new Error('DUFFEL_TOKEN is not defined in environment variables');
}

// Initialize the Duffel client
const duffel = new Duffel({
  token: process.env.DUFFEL_TOKEN,
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
    const timeRange: TimeRange = {
      from: '00:00',
      to: '23:59',
    };

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
    });

    // Get the offers for this request
    const offers = await duffel.offers.list({
      offer_request_id: offerRequest.data.id,
    });

    return offers.data;
  } catch (error) {
    console.error('Error searching flights:', error);
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