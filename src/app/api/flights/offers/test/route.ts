import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // This is a test endpoint to verify our offer details API structure
    const mockOffer = {
      id: 'off_test_123456789',
      live_mode: false,
      total_amount: '299.99',
      total_currency: 'USD',
      slices: [
        {
          id: 'sli_test_123',
          origin: {
            id: 'arp_lhr_gb',
            iata_code: 'LHR',
            name: 'London Heathrow Airport',
            city: {
              name: 'London',
              iata_code: 'LON',
            },
            time_zone: 'Europe/London',
          },
          destination: {
            id: 'arp_jfk_us',
            iata_code: 'JFK',
            name: 'John F. Kennedy International Airport',
            city: {
              name: 'New York',
              iata_code: 'NYC',
            },
            time_zone: 'America/New_York',
          },
          departing_at: '2024-07-15T10:00:00Z',
          arriving_at: '2024-07-15T18:00:00Z',
          duration: 'PT8H',
          segments: [
            {
              id: 'seg_test_123',
              origin: {
                id: 'arp_lhr_gb',
                iata_code: 'LHR',
                name: 'London Heathrow Airport',
                city: {
                  name: 'London',
                  iata_code: 'LON',
                },
                time_zone: 'Europe/London',
              },
              destination: {
                id: 'arp_jfk_us',
                iata_code: 'JFK',
                name: 'John F. Kennedy International Airport',
                city: {
                  name: 'New York',
                  iata_code: 'NYC',
                },
                time_zone: 'America/New_York',
              },
              departing_at: '2024-07-15T10:00:00Z',
              arriving_at: '2024-07-15T18:00:00Z',
              duration: 'PT8H',
              distance: '5500km',
              marketing_carrier: {
                id: 'arl_ba_gb',
                iata_code: 'BA',
                name: 'British Airways',
                logo_symbol_url:
                  'https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/BA.svg',
              },
              operating_carrier: {
                id: 'arl_ba_gb',
                iata_code: 'BA',
                name: 'British Airways',
                logo_symbol_url:
                  'https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/BA.svg',
              },
              aircraft: {
                id: 'arc_boeing_777_300er',
                iata_code: '77W',
                name: 'Boeing 777-300ER',
              },
              marketing_carrier_flight_number: 'BA117',
              operating_carrier_flight_number: 'BA117',
              origin_terminal: '5',
              destination_terminal: '7',
            },
          ],
        },
      ],
      passengers: [
        {
          passenger_id: 'pas_test_123',
          baggages: [
            {
              type: 'carry_on',
              quantity: 1,
              weight_value: 10,
              weight_unit: 'kg',
            },
            {
              type: 'checked',
              quantity: 1,
              weight_value: 23,
              weight_unit: 'kg',
            },
          ],
        },
      ],
      services: [],
      owner: {
        id: 'arl_ba_gb',
        iata_code: 'BA',
        name: 'British Airways',
        logo_symbol_url:
          'https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/BA.svg',
      },
      expires_at: '2024-07-15T12:00:00Z',
      created_at: '2024-07-15T09:00:00Z',
      updated_at: '2024-07-15T09:00:00Z',
      partial: false,
      passenger_identity_documents_required: true,
      supported_passenger_identity_document_types: ['passport'],
      conditions: {
        change_before_departure: {
          allowed: true,
          penalty_amount: '50.00',
          penalty_currency: 'USD',
        },
        refund_before_departure: {
          allowed: false,
        },
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Test offer data structure',
      data: mockOffer,
    });
  } catch (error: unknown) {
    console.error('Error in test endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Test endpoint failed';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
