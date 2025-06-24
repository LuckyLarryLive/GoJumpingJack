import { NextResponse } from 'next/server';
// import { Duffel } from '@duffel/api'; // Duffel class is not directly used here anymore
import { searchFlights, type FlightSearchParams } from '@/lib/duffel'; // Adjusted import path

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

// Add type definition for processed flight
interface ProcessedFlight {
  airline: string;
  price: number;
  link: string;
  stops: number;
  cabin_class: string;
  currency: string;
  outbound_segments: any[];
  return_segments: any[];
  origin_airport: string;
  destination_airport: string;
}

export async function GET() {
  return NextResponse.json(
    { message: 'This endpoint is deprecated. Use /api/flights/initiate-search.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { message: 'This endpoint is deprecated. Use /api/flights/initiate-search.' },
    { status: 410 }
  );
}
