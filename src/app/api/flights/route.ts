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

    const flightsRaw = await searchFlights(flightSearchParams);
    console.log('Duffel API raw response:', flightsRaw); // Log the raw response

    // Debug: Log the first offer's slice and segment for troubleshooting duration
    if (flightsRaw.length > 0) {
      const debugSlice = flightsRaw[0]?.slices?.[0];
      const debugSegment = debugSlice?.segments?.[0];
      const debugLastSegment = debugSlice?.segments?.[debugSlice?.segments?.length - 1];
      console.log('DEBUG Duffel slice:', debugSlice);
      console.log('DEBUG Duffel segment:', debugSegment);
      console.log('DEBUG Duffel lastSegment:', debugLastSegment);
    }

    // Robust ISO 8601 duration parser
    function parseDuration(isoDuration: string | undefined): string {
      if (!isoDuration || typeof isoDuration !== 'string') return 'N/A';
      // Match PT#H#M, PT#H, PT#M, etc.
      const match = isoDuration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
      if (!match) return 'N/A';
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      if (hours === 0 && minutes === 0) return 'N/A';
      return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`.trim();
    }

    const flights = flightsRaw.slice(0, 50).map((offer: any) => {
      const slice = offer.slices && offer.slices[0];
      const segment = slice && slice.segments && slice.segments[0];
      const lastSegment = slice && slice.segments && slice.segments[slice.segments.length - 1];
      // Use segment.duration or slice.duration
      const duration = parseDuration(segment?.duration || slice?.duration);
      return {
        origin_airport: segment ? segment.origin.iata_code : offer.owner.iata_code || '',
        destination_airport: lastSegment ? lastSegment.destination.iata_code : offer.owner.iata_code || '',
        departure_at: segment ? segment.departing_at : '',
        return_at: lastSegment ? lastSegment.arriving_at : undefined,
        airline: offer.owner?.name || offer.owner?.iata_code || 'Unknown',
        price: Number(offer.total_amount),
        link: offer.id ? `/book/${offer.id}` : '',
        stops: slice && slice.segments ? slice.segments.length - 1 : 0,
        cabin_class: offer.cabin_class || flightSearchParams.cabinClass,
        currency: offer.total_currency || 'USD',
        duration: duration,
      };
    });

    // Return the mapped flight data
    return NextResponse.json({ data: flights }, { status: 200 });

  } catch (error: any) {
    console.error('Duffel API error:', error); // Log any errors
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
