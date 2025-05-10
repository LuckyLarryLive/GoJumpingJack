import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Duffel's supported cabin classes
    const cabinClasses = [
      {
        id: 'economy',
        name: 'Economy',
        description: 'Standard economy class',
      },
      {
        id: 'premium_economy',
        name: 'Premium Economy',
        description: 'Enhanced economy class with more comfort',
      },
      {
        id: 'business',
        name: 'Business',
        description: 'Business class with premium services',
      },
      {
        id: 'first',
        name: 'First',
        description: 'First class with the highest level of service',
      },
    ];

    return NextResponse.json({
      success: true,
      message: 'Successfully retrieved cabin classes',
      data: cabinClasses,
    });
  } catch (error: any) {
    console.error('Error retrieving cabin classes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve cabin classes',
      },
      { status: 500 }
    );
  }
} 