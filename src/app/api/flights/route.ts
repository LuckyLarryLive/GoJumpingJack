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
  const limitParam = searchParams.get('limit');
  const sortParam = searchParams.get('sort');
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
    if (Number.isNaN(parsedInfants) || parsedInfants < 0 || parsedInfants > 9) {
      return NextResponse.json({ message: 'Invalid number of infants; must be between 0 and 9.' }, { status: 400 });
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
    console.log('Duffel API raw response:', flightsRaw);

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
      // Helper to map segments
      function mapSegments(segments: any[]) {
        return segments.map((seg: any) => ({
          origin_airport: seg.origin?.iata_code || '',
          departure_at: seg.departing_at || '',
          destination_airport: seg.destination?.iata_code || '',
          arrival_at: seg.arriving_at || '',
          duration: parseDuration(seg.duration),
        }));
      }
      const slices = offer.slices || [];
      const outboundSegments = slices[0]?.segments ? mapSegments(slices[0].segments) : [];
      const returnSegments = slices[1]?.segments ? mapSegments(slices[1].segments) : [];
      
      // Get origin and destination from first outbound segment
      const firstOutboundSegment = outboundSegments[0];
      return {
        airline: offer.owner?.name || offer.owner?.iata_code || 'Unknown',
        price: Number(offer.total_amount),
        link: offer.id ? `/book/${offer.id}` : '',
        stops: (slices[0]?.segments?.length || 1) - 1 + ((slices[1]?.segments?.length || 1) - 1),
        cabin_class: offer.cabin_class || flightSearchParams.cabinClass,
        currency: offer.total_currency || 'USD',
        outbound_segments: outboundSegments,
        return_segments: returnSegments,
        // Add top-level origin and destination from first outbound segment
        origin_airport: firstOutboundSegment?.origin_airport || '',
        destination_airport: firstOutboundSegment?.destination_airport || '',
      };
    });

    // Apply sorting
    let processedFlights = flights;
    if (sortParam === 'price') {
      processedFlights = [...processedFlights].sort((a, b) => a.price - b.price);
    } else if (sortParam === 'duration') {
      processedFlights = [...processedFlights].sort((a, b) => {
        const durationA = a.outbound_segments[0]?.duration ? 
          parseInt(a.outbound_segments[0].duration.replace(/[^0-9]/g, '')) : 0;
        const durationB = b.outbound_segments[0]?.duration ? 
          parseInt(b.outbound_segments[0].duration.replace(/[^0-9]/g, '')) : 0;
        return durationA - durationB;
      });
    } else if (sortParam === 'departure') {
      processedFlights = [...processedFlights].sort((a, b) => 
        new Date(a.outbound_segments[0]?.departure_at || 0).getTime() - 
        new Date(b.outbound_segments[0]?.departure_at || 0).getTime()
      );
    }

    // Apply filters
    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      if (!isNaN(maxPriceNum)) {
        processedFlights = processedFlights.filter(flight => flight.price <= maxPriceNum);
      }
    }

    const stops = searchParams.get('stops');
    if (stops) {
      const stopNumbers = stops.split(',').map(s => parseInt(s));
      processedFlights = processedFlights.filter(flight => stopNumbers.includes(flight.stops));
    }

    const airlines = searchParams.get('airlines');
    if (airlines) {
      const airlineList = airlines.split(',');
      processedFlights = processedFlights.filter(flight => airlineList.includes(flight.airline));
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFlights = processedFlights.slice(startIndex, endIndex);

    // Return the paginated flight data with total count
    return NextResponse.json({ 
      data: paginatedFlights,
      total: processedFlights.length,
      page,
      limit,
      totalPages: Math.ceil(processedFlights.length / limit)
    }, { status: 200 });

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
