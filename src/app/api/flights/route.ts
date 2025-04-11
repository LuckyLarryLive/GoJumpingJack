import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departure_at = searchParams.get('departure_at');
  const return_at = searchParams.get('return_at');

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Missing origin or destination' },
      { status: 400 }
    );
  }

  const baseURL = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';
  const token = process.env.TRAVELPAYOUTS_TOKEN;

  // First attempt: exact match with dates
  let url = `${baseURL}?origin=${origin}&destination=${destination}&currency=usd&token=${token}`;
  if (departure_at) url += `&departure_at=${departure_at}`;
  if (return_at) url += `&return_at=${return_at}`;

  const res = await fetch(url);
  const data = await res.json();

  // If no data, retry without departure_at for broader results
  if (data.data.length === 0 && departure_at) {
    const fallbackUrl = `${baseURL}?origin=${origin}&destination=${destination}&currency=usd&token=${token}`;
    const fallbackRes = await fetch(fallbackUrl);
    const fallbackData = await fallbackRes.json();

    return NextResponse.json({
      exactMatch: false,
      ...fallbackData
    });
  }

  return NextResponse.json({
    exactMatch: true,
    ...data
  });
}

