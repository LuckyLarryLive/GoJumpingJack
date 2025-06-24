import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';

export async function GET() {
  try {
    if (!process.env.DUFFEL_TOKEN) {
      return NextResponse.json(
        { error: 'DUFFEL_TOKEN is not defined in environment variables' },
        { status: 500 }
      );
    }

    const duffel = new Duffel({
      token: process.env.DUFFEL_TOKEN,
    });

    // Sample search parameters
    const searchParams = {
      origin: 'LHR', // London Heathrow
      destination: 'JFK', // New York JFK
      departureDate: '2024-04-01', // Example date
      passengers: {
        adults: 1,
      },
      cabinClass: 'economy' as const,
    };

    // Create an offer request
    const offerRequest = await duffel.offerRequests.create({
      slices: [
        {
          origin: searchParams.origin,
          destination: searchParams.destination,
          departure_date: searchParams.departureDate,
          arrival_time: {
            from: '00:00',
            to: '23:59',
          },
          departure_time: {
            from: '00:00',
            to: '23:59',
          },
        },
      ],
      passengers: [
        {
          type: 'adult',
        },
      ],
      cabin_class: searchParams.cabinClass,
    });

    // Get the offers for this request
    const offers = await duffel.offers.list({
      offer_request_id: offerRequest.data.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully performed test search',
      searchParams,
      data: offers.data,
    });
  } catch (error: any) {
    console.error('Error performing test search:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to perform test search',
      },
      { status: 500 }
    );
  }
}
