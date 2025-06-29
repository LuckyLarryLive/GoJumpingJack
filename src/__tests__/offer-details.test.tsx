import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OfferDetails from '@/components/OfferDetails';
import { DuffelOffer } from '@/types/duffel';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({
    offer_id: 'test_offer_123',
  }),
}));

const mockOffer: DuffelOffer = {
  id: 'off_test_123456789',
  live_mode: false,
  total_amount: '299.99',
  total_currency: 'USD',
  tax_amount: '50.00',
  tax_currency: 'USD',
  base_amount: '249.99',
  base_currency: 'USD',
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

describe('OfferDetails Component', () => {
  const mockProps = {
    offer: mockOffer,
    selectedSeats: [],
    onSeatSelection: jest.fn(),
    seatMapLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders offer details correctly', () => {
    render(
      <CurrencyProvider>
        <OfferDetails {...mockProps} />
      </CurrencyProvider>
    );

    // Check if price is displayed (now formatted with currency symbol)
    expect(screen.getByText('$299.99')).toBeInTheDocument();
    expect(screen.getByText('Total Price')).toBeInTheDocument();

    // Check if airline is displayed
    expect(screen.getByText('British Airways')).toBeInTheDocument();

    // Check if flight itinerary is displayed
    expect(screen.getByText('Flight Itinerary')).toBeInTheDocument();
    expect(screen.getByText('Outbound Flight')).toBeInTheDocument();

    // Check if airports are displayed
    expect(screen.getByText(/London Heathrow Airport/)).toBeInTheDocument();
    expect(screen.getByText(/John F. Kennedy International Airport/)).toBeInTheDocument();
  });

  it('displays baggage allowance correctly', () => {
    render(
      <CurrencyProvider>
        <OfferDetails {...mockProps} />
      </CurrencyProvider>
    );

    expect(screen.getByText('Baggage Allowance')).toBeInTheDocument();
    expect(screen.getByText('Carry-on Bags')).toBeInTheDocument();
    expect(screen.getByText('Checked Bags')).toBeInTheDocument();
  });

  it('displays fare conditions correctly', () => {
    render(
      <CurrencyProvider>
        <OfferDetails {...mockProps} />
      </CurrencyProvider>
    );

    expect(screen.getByText('Fare Conditions')).toBeInTheDocument();
    expect(screen.getByText('Changes')).toBeInTheDocument();
    expect(screen.getByText('Refunds')).toBeInTheDocument();
    expect(screen.getByText('✓ Changes allowed')).toBeInTheDocument();
    expect(screen.getByText('✗ Non-refundable')).toBeInTheDocument();
  });

  it('formats duration correctly', () => {
    render(
      <CurrencyProvider>
        <OfferDetails {...mockProps} />
      </CurrencyProvider>
    );

    // The PT8H duration should be formatted as "8h"
    expect(screen.getByText('8h')).toBeInTheDocument();
  });

  it('displays terminal information when available', () => {
    render(
      <CurrencyProvider>
        <OfferDetails {...mockProps} />
      </CurrencyProvider>
    );

    expect(screen.getByText(/Terminal 5/)).toBeInTheDocument();
    expect(screen.getByText(/Terminal 7/)).toBeInTheDocument();
  });
});
