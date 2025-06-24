import { Airport } from '@/types/airport';

export const airports: Airport[] = [
  // Orlando airports
  {
    code: 'MCO',
    name: 'Orlando International Airport',
    city: 'Orlando',
    state: 'Florida',
    country: 'United States',
    latitude: 28.4312,
    longitude: -81.3081,
  },
  {
    code: 'SFB',
    name: 'Orlando Sanford International Airport',
    city: 'Orlando',
    state: 'Florida',
    country: 'United States',
    latitude: 28.7776,
    longitude: -81.2375,
  },
  {
    code: 'DAB',
    name: 'Daytona Beach International Airport',
    city: 'Orlando',
    state: 'Florida',
    country: 'United States',
    latitude: 29.1799,
    longitude: -81.0581,
  },
  // New York airports
  {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    latitude: 40.6413,
    longitude: -73.7781,
  },
  {
    code: 'LGA',
    name: 'LaGuardia Airport',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    latitude: 40.7769,
    longitude: -73.874,
  },
  {
    code: 'EWR',
    name: 'Newark Liberty International Airport',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    latitude: 40.6895,
    longitude: -74.1745,
  },
  // Los Angeles airports
  {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    state: 'California',
    country: 'United States',
    latitude: 33.9416,
    longitude: -118.4085,
  },
  {
    code: 'BUR',
    name: 'Bob Hope Airport',
    city: 'Los Angeles',
    state: 'California',
    country: 'United States',
    latitude: 34.2006,
    longitude: -118.3587,
  },
  {
    code: 'ONT',
    name: 'Ontario International Airport',
    city: 'Los Angeles',
    state: 'California',
    country: 'United States',
    latitude: 34.0559,
    longitude: -117.6011,
  },
  // Single airport cities
  {
    code: 'MIA',
    name: 'Miami International Airport',
    city: 'Miami',
    state: 'Florida',
    country: 'United States',
    latitude: 25.7959,
    longitude: -80.287,
  },
  {
    code: 'SEA',
    name: 'Seattle-Tacoma International Airport',
    city: 'Seattle',
    state: 'Washington',
    country: 'United States',
    latitude: 47.4502,
    longitude: -122.3088,
  },
];

export const getAirportsByCity = (city: string): Airport[] => {
  return airports.filter(airport => airport.city.toLowerCase() === city.toLowerCase());
};

export const searchAirports = (query: string): Airport[] => {
  const searchTerm = query.toLowerCase();
  return airports.filter(
    airport =>
      airport.name.toLowerCase().includes(searchTerm) ||
      airport.city.toLowerCase().includes(searchTerm) ||
      airport.code.toLowerCase().includes(searchTerm)
  );
};
