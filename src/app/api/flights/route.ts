import { NextResponse } from 'next/server';

interface TravelpayoutsFlightData {
  origin: string;
  destination: string;
  origin_airport: string;
  destination_airport: string;
  price: number;
  airline: string;
  flight_number: string;
  departure_at: string;
  return_at?: string;
  transfers: number;
  duration: number;
  link: string;
}

interface TravelpayoutsResponse {
  success: boolean;
  data: TravelpayoutsFlightData[] | null;
  currency: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const origin = searchParams.get('originAirport'); // Use airport IATA, e.g. MCO
  const destination = searchParams.get('destinationAirport'); // e.g. JFK
  const departureDate = searchParams.get('departureDate');
  const returnDate = searchParams.get('returnDate');

  if (!origin || !destination) {
    return NextResponse.json(
      { message: 'Missing required query parameters: originAirport and destinationAirport' },
      { status: 400 }
    );
  }

  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) {
    console.error("TRAVELPAYOUTS_TOKEN environment variable is not set.");
    return NextResponse.json(
      { message: 'Server configuration error: API token missing.' },
      { status: 500 }
    );
  }

  const baseURL = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';

  try {
    let url = `${baseURL}?origin=${origin}&destination=${destination}&currency=usd&token=${token}`;
    if (departureDate) url += `&departure_at=${departureDate}`;
    if (returnDate) url += `&return_at=${returnDate}`;

    console.log(`Fetching initial URL: ${url}`);
    const res = await fetch(url);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Travelpayouts API error (Initial Fetch): Status ${res.status}, Body: ${errorBody}`);
      return NextResponse.json({ message: `Failed to fetch flight data. Status: ${res.status}` }, { status: 502 });
    }

    const initialData: TravelpayoutsResponse = await res.json();
    const noInitialResults = !initialData?.data || initialData.data.length === 0;

    if (noInitialResults && departureDate) {
      console.log(`No initial results found for ${departureDate}. Retrying without dates...`);
      const fallbackUrl = `${baseURL}?origin=${origin}&destination=${destination}&currency=usd&token=${token}`;
      const fallbackRes = await fetch(fallbackUrl);

      if (!fallbackRes.ok) {
        const fallbackErrorBody = await fallbackRes.text();
        console.error(`Travelpayouts API error (Fallback Fetch): Status ${fallbackRes.status}, Body: ${fallbackErrorBody}`);
        return NextResponse.json({ message: `Failed to fetch fallback flight data. Status: ${fallbackRes.status}` }, { status: 502 });
      }

      const fallbackData: TravelpayoutsResponse = await fallbackRes.json();
      return NextResponse.json({
        data: fallbackData?.data || [],
        exactMatch: false
      }, { status: 200 });
    }

    return NextResponse.json({
      data: initialData?.data || [],
      exactMatch: true
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error in /api/flights route:", error);
    return NextResponse.json(
      { message: 'Unexpected error fetching flight data.', error: error.message },
      { status: 500 }
    );
  }
}
