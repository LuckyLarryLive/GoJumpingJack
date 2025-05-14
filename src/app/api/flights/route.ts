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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('originAirport');
  const destination = searchParams.get('destinationAirport');
  const departureDate = searchParams.get('departureDate');
  const returnDate = searchParams.get('returnDate');
  const adultsString = searchParams.get('adults');
  const cabinClassParam = searchParams.get('cabinClass');
  // const currency = searchParams.get('currency') || 'USD'; // Currency is not part of FlightSearchParams in duffel.ts

  if (!origin || !destination || !departureDate || !adultsString) {
    return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
  }

  const adults = parseInt(adultsString, 10);
  if (Number.isNaN(adults) || adults <= 0) {
    return NextResponse.json({ message: 'Invalid number of adults' }, { status: 400 });
  }

  let children: number | undefined = undefined;
  const childrenQueryParam = searchParams.get('children');
  if (childrenQueryParam !== null) {
    const parsedChildren = parseInt(childrenQueryParam, 10);
    if (Number.isNaN(parsedChildren) || parsedChildren < 0) {
      return NextResponse.json({ message: 'Invalid number of children; must be a non-negative integer.' }, { status: 400 });
    }
    children = parsedChildren;
  }

  let infants: number | undefined = undefined;
  const infantsQueryParam = searchParams.get('infants');
  if (infantsQueryParam !== null) {
    const parsedInfants = parseInt(infantsQueryParam, 10);
    if (Number.isNaN(parsedInfants) || parsedInfants < 0) {
      return NextResponse.json({ message: 'Invalid number of infants; must be a non-negative integer.' }, { status: 400 });
    }
    infants = parsedInfants;
  }

  const cabinClass = (cabinClassParam || 'economy') as FlightSearchParams['cabinClass'];
  if (!['economy', 'premium_economy', 'business', 'first'].includes(cabinClass)) {
    return NextResponse.json({ message: 'Invalid cabin class' }, { status: 400 });
  }
  
  // DUFFEL_TOKEN check is done within src/lib/duffel.ts, so removing from here to avoid redundancy
  // const duffelToken = process.env.DUFFEL_TOKEN;
  // if (!duffelToken) {
  //   console.error('DUFFEL_TOKEN is not defined');
  //   return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
  // }

  try {
    // const duffel = new Duffel({ // Duffel client is already initialized in src/lib/duffel.ts
    //   token: duffelToken
    // });

    const passengers: FlightSearchParams['passengers'] = {
      adults,
    };

    if (typeof children === 'number') {
      passengers.children = children;
    }
    if (typeof infants === 'number') {
      passengers.infants = infants;
    }

    const flightSearchParams: FlightSearchParams = {
      origin,
      destination,
      departureDate,
      passengers, // Use the constructed passengers object
      cabinClass,
    };

    if (returnDate) {
      flightSearchParams.returnDate = returnDate;
    }

    const flights = await searchFlights(flightSearchParams);

    // Return the actual flight data from Duffel
    return NextResponse.json({ data: flights }, { status: 200 });

  } catch (error: any) { // Specify 'any' or a more specific error type if known
    console.error('Error in flight search calling searchFlights:', error);
    // It's better to parse Duffel errors more robustly.
    // For now, logging the whole error and returning a generic message.
    let errorMessage = 'Failed to fetch flight data.';
    let statusCode = 500;
    if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors.map((e: any) => e.message).join(', ');
        // Attempt to get a status code from the first error, or use a general one
        const duffelError = error.errors[0];
        if (duffelError.meta && duffelError.meta.status) {
            statusCode = duffelError.meta.status;
        } else if (error.meta && error.meta.status) {
            statusCode = error.meta.status; // Fallback to top-level meta status
        }
    } else if (error.message) {
        errorMessage = error.message;
    }

    return NextResponse.json({ message: errorMessage, details: error.errors || error }, { status: statusCode });
  }
}
