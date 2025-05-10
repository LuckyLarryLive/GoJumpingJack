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

    // Get a list of airlines
    const response = await duffel.airlines.list();

    // Enhance the response with additional information
    const enhancedAirlines = response.data.map(airline => ({
      ...airline,
      hasLogo: !!airline.logo_symbol_url,
      hasConditions: !!airline.conditions_of_carriage_url,
      isActive: true, // You might want to add logic to determine if an airline is currently active
    }));

    return NextResponse.json({
      success: true,
      message: 'Successfully retrieved airlines',
      data: enhancedAirlines,
    });
  } catch (error: any) {
    console.error('Error retrieving airlines:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve airlines',
      },
      { status: 500 }
    );
  }
} 