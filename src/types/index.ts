export interface Airport {
  airport_code: string;
  airport_name: string;
  city_code: string;
  city_name: string;
  country_code?: string;
  region?: string;
}

export interface FlightSegment {
  origin_airport: string;
  departure_at: string;
  destination_airport: string;
  arrival_at: string;
  duration: string;
}

export interface Flight {
  airline: string;
  price: number;
  link: string;
  stops: number;
  cabin_class: string;
  currency: string;
  outbound_segments: FlightSegment[];
  return_segments: FlightSegment[];
}

export interface FlightApiResponse {
  data: Flight[];
}

export interface SearchParamsType {
  originAirport: string;
  destinationAirport: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
  currency?: string;
  maxConnections?: number;
  fromDisplayValue?: string;
  toDisplayValue?: string;
  fromCityNameForApi?: string;
  fromCountryCodeForApi?: string;
  fromRegionForApi?: string;
  fromSelectionType?: 'airport' | 'city' | null;
  toCityNameForApi?: string;
  toCountryCodeForApi?: string;
  toRegionForApi?: string;
  toSelectionType?: 'airport' | 'city' | null;
}
