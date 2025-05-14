export interface Airport { 
    airport_code: string; 
    airport_name: string; 
    city_code: string; 
    city_name: string;
    country_code?: string;
    region?: string;
}

export interface Flight { 
    origin_airport: string; 
    destination_airport: string; 
    departure_at: string; 
    return_at?: string; 
    airline: string; 
    price: number; 
    link: string;
    stops: number;
    cabin_class: string;
    currency: string;
    duration: string;
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
    toCityNameForApi?: string;
    toCountryCodeForApi?: string;
    toRegionForApi?: string;
    toSelectionType?: 'airport' | 'city' | null;
}
