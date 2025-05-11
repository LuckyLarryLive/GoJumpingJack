import { Airport } from '@/types/airport';

export const airports: Airport[] = [
  {
    code: 'MCO',
    name: 'Orlando International Airport',
    city: 'Orlando',
    state: 'Florida',
    country: 'United States',
    latitude: 28.4312,
    longitude: -81.3081
  },
  {
    code: 'SFB',
    name: 'Orlando Sanford International Airport',
    city: 'Orlando',
    state: 'Florida',
    country: 'United States',
    latitude: 28.7776,
    longitude: -81.2375
  },
  {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    latitude: 40.6413,
    longitude: -73.7781
  },
  {
    code: 'LGA',
    name: 'LaGuardia Airport',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    latitude: 40.7769,
    longitude: -73.8740
  },
  {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    state: 'California',
    country: 'United States',
    latitude: 33.9416,
    longitude: -118.4085
  }
];

export const getAirportsByCity = (city: string): Airport[] => {
  return airports.filter(airport => 
    airport.city.toLowerCase() === city.toLowerCase()
  );
};

export const searchAirports = (query: string): Airport[] => {
  const searchTerm = query.toLowerCase();
  return airports.filter(airport => 
    airport.name.toLowerCase().includes(searchTerm) ||
    airport.city.toLowerCase().includes(searchTerm) ||
    airport.code.toLowerCase().includes(searchTerm)
  );
}; 