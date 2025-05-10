export interface Airport { 
    airport_code: string; 
    airport_name: string; 
    city_code: string; 
    city_name: string;
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
    travelers: string; 
    tripType: 'round-trip' | 'one-way'; 
    fromDisplayValue?: string | null; 
    toDisplayValue?: string | null;
    cabinClass?: string;
    currency?: string;
    maxConnections?: number;
    passengers?: {
        adults: number;
        children: number;
        infants: number;
    };
}
