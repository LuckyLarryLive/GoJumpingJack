import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const passengerTypes = [
      {
        type: 'adult',
        name: 'Adult',
        description: 'Passenger aged 12 or over',
        minAge: 12,
        maxAge: null,
        requiresAdult: false,
      },
      {
        type: 'child',
        name: 'Child',
        description: 'Passenger aged 2-11',
        minAge: 2,
        maxAge: 11,
        requiresAdult: true,
      },
      {
        type: 'infant',
        name: 'Infant',
        description: 'Passenger under 2 years old',
        minAge: 0,
        maxAge: 1,
        requiresAdult: true,
      },
    ];

    return NextResponse.json({
      success: true,
      message: 'Successfully retrieved passenger types',
      data: passengerTypes,
    });
  } catch (error: any) {
    console.error('Error retrieving passenger types:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve passenger types',
      },
      { status: 500 }
    );
  }
}
