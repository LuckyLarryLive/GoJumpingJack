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

    // Test the connection by making a simple API call
    // We'll try to get a list of airlines as a simple test
    const response = await duffel.airlines.list();

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Duffel API',
      data: response.data,
    });
  } catch (error: any) {
    console.error('Error testing Duffel connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to connect to Duffel API',
      },
      { status: 500 }
    );
  }
}
