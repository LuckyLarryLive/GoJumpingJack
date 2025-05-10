import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';

// --- Type Definitions ---
interface DuffelFlightData {
  origin_airport: string;
  destination_airport: string;
  departure_at: string;
  return_at?: string;
  airline: string;
  price: number;
  link: string;
  stops: number;
  cabin_class: string;
  currency: string;
  duration: string;
}

interface DuffelResponse {
  data: DuffelFlightData[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('originAirport');
  const destination = searchParams.get('destinationAirport');
  const departureDate = searchParams.get('departureDate');
  const returnDate = searchParams.get('returnDate');
  const adults = searchParams.get('adults');
  const cabinClass = searchParams.get('cabinClass') || 'economy';
  const currency = searchParams.get('currency') || 'USD';

  if (!origin || !destination || !departureDate || !adults) {
    return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
  }

  const duffelToken = process.env.DUFFEL_TOKEN;

  if (!duffelToken) {
    console.error('DUFFEL_TOKEN is not defined');
    return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
  }

  try {
    const duffel = new Duffel({
      token: duffelToken
    });

    // TODO: Implement Duffel API integration
    // This is a placeholder response structure
    return NextResponse.json({
      data: [],
      message: 'Duffel integration pending'
    }, { status: 501 }); // 501 Not Implemented

  } catch (error) {
    console.error('Error in flight search:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
