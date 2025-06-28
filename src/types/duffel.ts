import { z } from 'zod';

// Duffel Offer Types
export interface DuffelAirport {
  id: string;
  iata_code: string;
  name: string;
  city: {
    name: string;
    iata_code: string;
  };
  time_zone: string;
}

export interface DuffelAirline {
  id: string;
  iata_code: string;
  name: string;
  logo_symbol_url?: string;
  logo_lockup_url?: string;
}

export interface DuffelAircraft {
  id: string;
  iata_code: string;
  name: string;
}

export interface DuffelSegment {
  id: string;
  origin: DuffelAirport;
  destination: DuffelAirport;
  departing_at: string;
  arriving_at: string;
  duration: string;
  distance: string;
  marketing_carrier: DuffelAirline;
  operating_carrier: DuffelAirline;
  aircraft: DuffelAircraft;
  marketing_carrier_flight_number: string;
  operating_carrier_flight_number: string;
  origin_terminal?: string;
  destination_terminal?: string;
}

export interface DuffelSlice {
  id: string;
  origin: DuffelAirport;
  destination: DuffelAirport;
  departing_at: string;
  arriving_at: string;
  duration: string;
  segments: DuffelSegment[];
}

export interface DuffelBaggage {
  type: 'carry_on' | 'checked';
  quantity: number;
  weight_value?: number;
  weight_unit?: string;
  dimensions_value?: string;
  dimensions_unit?: string;
}

export interface DuffelPassengerBaggage {
  passenger_id: string;
  baggages: DuffelBaggage[];
}

export interface DuffelService {
  id: string;
  type: string;
  quantity: number;
  total_amount: string;
  total_currency: string;
  passenger_ids: string[];
  segment_ids?: string[];
}

export interface DuffelOffer {
  id: string;
  live_mode: boolean;
  total_amount: string;
  total_currency: string;
  tax_amount?: string;
  tax_currency?: string;
  base_amount?: string;
  base_currency?: string;
  slices: DuffelSlice[];
  passengers: DuffelPassengerBaggage[];
  services: DuffelService[];
  owner: DuffelAirline;
  expires_at: string;
  created_at: string;
  updated_at: string;
  partial: boolean;
  passenger_identity_documents_required: boolean;
  supported_passenger_identity_document_types: string[];
  conditions: {
    change_before_departure?: {
      allowed: boolean;
      penalty_amount?: string;
      penalty_currency?: string;
    };
    refund_before_departure?: {
      allowed: boolean;
      penalty_amount?: string;
      penalty_currency?: string;
    };
  };
}

// Seat Map Types
export interface DuffelSeatElement {
  type: 'seat' | 'bassinet' | 'empty' | 'lavatory' | 'galley' | 'closet' | 'exit';
  id?: string;
  designator?: string;
  name?: string;
  available?: boolean;
  disclosures?: string[];
  services?: DuffelService[];
}

export interface DuffelSeatMapRow {
  sections: {
    elements: DuffelSeatElement[];
  }[];
}

export interface DuffelSeatMapCabin {
  aisles: number;
  rows: DuffelSeatMapRow[];
  wings?: {
    first_row_index: number;
    last_row_index: number;
  };
  exits?: {
    row_index: number;
    position: 'left' | 'right';
  }[];
}

export interface DuffelSeatMap {
  id: string;
  segment_id: string;
  slice_id: string;
  cabins: DuffelSeatMapCabin[];
}

// Validation Schemas
export const OfferIdSchema = z.string().min(1, 'Offer ID is required');

export const SeatSelectionSchema = z.object({
  passenger_id: z.string(),
  seat_id: z.string(),
  service_id: z.string().optional(),
});

export const SeatSelectionsSchema = z.array(SeatSelectionSchema);

// API Response Types
export interface OfferDetailsResponse {
  success: boolean;
  data?: DuffelOffer;
  error?: string;
}

export interface SeatMapResponse {
  success: boolean;
  data?: DuffelSeatMap[];
  available: boolean;
  error?: string;
}

// Helper Types
export interface ProcessedOfferDetails {
  offer: DuffelOffer;
  totalPrice: {
    amount: string;
    currency: string;
  };
  itinerary: {
    outbound: DuffelSlice;
    return?: DuffelSlice;
  };
  layovers: {
    sliceIndex: number;
    segmentIndex: number;
    duration: string;
    airport: DuffelAirport;
  }[];
  baggageAllowance: {
    carryOn: DuffelBaggage[];
    checked: DuffelBaggage[];
  };
  fareConditions: {
    changeable: boolean;
    refundable: boolean;
    changePolicy?: string;
    refundPolicy?: string;
  };
}

export interface SelectedSeat {
  passengerId: string;
  seatId: string;
  serviceId?: string | undefined;
  segmentId: string;
  sliceId: string;
  designator: string;
  price?: {
    amount: string;
    currency: string;
  };
}
