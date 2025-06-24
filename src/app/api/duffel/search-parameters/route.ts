import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const searchParameters = {
      origin: {
        type: 'string',
        format: 'IATA code',
        description: '3-letter IATA airport code for departure',
        example: 'LHR',
        required: true,
      },
      destination: {
        type: 'string',
        format: 'IATA code',
        description: '3-letter IATA airport code for arrival',
        example: 'JFK',
        required: true,
      },
      departureDate: {
        type: 'string',
        format: 'YYYY-MM-DD',
        description: 'Date of departure',
        example: '2024-04-01',
        required: true,
        constraints: {
          minDate: 'Today',
          maxDate: '365 days from today',
        },
      },
      returnDate: {
        type: 'string',
        format: 'YYYY-MM-DD',
        description: 'Date of return (for round trips)',
        example: '2024-04-08',
        required: false,
        constraints: {
          minDate: 'Same as departure date',
          maxDate: '365 days from departure date',
        },
      },
      passengers: {
        type: 'object',
        description: 'Number of passengers by type',
        required: true,
        properties: {
          adults: {
            type: 'number',
            description: 'Number of adult passengers (12+ years)',
            minimum: 1,
            maximum: 9,
            required: true,
          },
          children: {
            type: 'number',
            description: 'Number of child passengers (2-11 years)',
            minimum: 0,
            maximum: 8,
            required: false,
          },
          infants: {
            type: 'number',
            description: 'Number of infant passengers (0-1 years)',
            minimum: 0,
            maximum: 8,
            required: false,
          },
        },
        constraints: {
          totalPassengers: 'Maximum 9 passengers total',
          infantsPerAdult: 'Maximum 1 infant per adult',
        },
      },
      cabinClass: {
        type: 'string',
        description: 'Cabin class for the flight',
        required: true,
        enum: ['economy', 'premium_economy', 'business', 'first'],
        default: 'economy',
      },
      currency: {
        type: 'string',
        format: 'ISO 4217',
        description: 'Currency for pricing',
        example: 'USD',
        required: false,
        default: 'USD',
      },
      maxConnections: {
        type: 'number',
        description: 'Maximum number of connections allowed',
        minimum: 0,
        maximum: 2,
        required: false,
        default: 2,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Successfully retrieved search parameters',
      data: searchParameters,
    });
  } catch (error: any) {
    console.error('Error retrieving search parameters:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve search parameters',
      },
      { status: 500 }
    );
  }
}
