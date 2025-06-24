import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const constraints = {
      general: {
        maxPassengers: 9,
        maxInfantsPerAdult: 1,
        maxBookingWindow: 365, // days
        minBookingWindow: 0, // days
      },
      pricing: {
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        defaultCurrency: 'USD',
        priceRounding: 2, // decimal places
      },
      connections: {
        maxConnections: 2,
        minConnectionTime: 30, // minutes
        maxConnectionTime: 24, // hours
      },
      baggage: {
        cabinBaggage: {
          maxWeight: 10, // kg
          maxDimensions: '55x40x20', // cm
        },
        checkedBaggage: {
          maxWeight: 32, // kg
          maxDimensions: '90x75x43', // cm
        },
      },
      booking: {
        maxOffersPerRequest: 50,
        offerExpirationTime: 300, // seconds
        maxPaxPerBooking: 9,
        minPaxPerBooking: 1,
      },
      payment: {
        supportedPaymentMethods: ['credit_card', 'debit_card'],
        requiredFields: ['card_number', 'expiry_date', 'cvv', 'cardholder_name'],
      },
      cancellation: {
        refundable: {
          allowed: true,
          timeLimit: 24, // hours before departure
          feePercentage: 10, // percentage of ticket price
        },
        nonRefundable: {
          allowed: false,
          exceptions: ['medical_emergency', 'death_in_family'],
        },
      },
      changes: {
        allowed: true,
        timeLimit: 24, // hours before departure
        feePercentage: 15, // percentage of ticket price
        restrictions: ['same_airline', 'same_route'],
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Successfully retrieved offer constraints',
      data: constraints,
    });
  } catch (error: any) {
    console.error('Error retrieving offer constraints:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve offer constraints',
      },
      { status: 500 }
    );
  }
}
