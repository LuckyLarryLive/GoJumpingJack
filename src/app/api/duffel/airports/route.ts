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

    // Get a list of airports
    const response = await duffel.airports.list();

    return NextResponse.json({
      success: true,
      message: 'Successfully retrieved airports',
      data: response.data,
    });
  } catch (error: any) {
    console.error('Error retrieving airports:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve airports',
      },
      { status: 500 }
    );
  }
}
