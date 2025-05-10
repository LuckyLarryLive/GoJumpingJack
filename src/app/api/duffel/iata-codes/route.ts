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

    // Enhance the response with additional information and validation rules
    const enhancedAirports = response.data.map(airport => ({
      iata_code: airport.iata_code,
      name: airport.name,
      city: airport.city,
      timezone: airport.time_zone,
      coordinates: {
        latitude: airport.latitude,
        longitude: airport.longitude,
      },
      validation: {
        format: '3 uppercase letters',
        pattern: '^[A-Z]{3}$',
        example: airport.iata_code,
      },
    }));

    // Add validation rules
    const validationRules = {
      format: {
        type: 'string',
        pattern: '^[A-Z]{3}$',
        description: '3 uppercase letters',
        example: 'LHR',
      },
      constraints: {
        minLength: 3,
        maxLength: 3,
        allowedCharacters: 'A-Z',
        caseSensitive: true,
      },
      commonCodes: {
        LHR: 'London Heathrow',
        JFK: 'New York JFK',
        LAX: 'Los Angeles',
        SFO: 'San Francisco',
        CDG: 'Paris Charles de Gaulle',
        FRA: 'Frankfurt',
        SIN: 'Singapore',
        HKG: 'Hong Kong',
        DXB: 'Dubai',
        SYD: 'Sydney',
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Successfully retrieved IATA codes and validation rules',
      data: {
        airports: enhancedAirports,
        validationRules,
      },
    });
  } catch (error: any) {
    console.error('Error retrieving IATA codes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve IATA codes',
      },
      { status: 500 }
    );
  }
} 