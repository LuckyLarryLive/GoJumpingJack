'use client'; // Required for useState, useEffect

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { SearchParamsType, Flight, FlightApiResponse } from '@/types'; // Import shared types
import FlightCard from './FlightCard'; // <--- ADD BACK FlightCard Import

// --- Component Props Interface ---
interface FlightResultsProps {
  searchParams: SearchParamsType | null;
}

// --- Flight Results Component ---
const FlightResults: React.FC<FlightResultsProps> = ({ searchParams }) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch Logic (Keep as is from Step 2) ---
  useEffect(() => {
    if (!searchParams) {
      setFlights([]); setError(null); setIsLoading(false); return;
    }

    const fetchFlights = async () => {
      setIsLoading(true); setError(null); setFlights([]);

      const originAirports = searchParams.originAirport.split(',');
      const destinationAirports = searchParams.destinationAirport.split(',');

      const allFlights: Flight[] = [];
      const errors: string[] = [];

      for (const origin of originAirports) {
        for (const destination of destinationAirports) {
          const query = new URLSearchParams({
            originAirport: origin,
            destinationAirport: destination,
            departureDate: searchParams.departureDate,
            adults: searchParams.adults.toString(),
            limit: '3',
            sort: 'price',
          });
          if (searchParams.returnDate) {
            query.set('returnDate', searchParams.returnDate);
          }
          console.log(`FlightResults fetching: /api/flights?${query.toString()}`);
          try {
            const response = await fetch(`/api/flights?${query.toString()}`);
            if (!response.ok) {
              const errorText = await response.text();
              errors.push(`Search failed for ${origin} to ${destination}: ${response.statusText} (Status: ${response.status})`);
              continue;
            }
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              errors.push(`Received unexpected response format from server for ${origin} to ${destination}.`);
              continue;
            }
            const apiResponse: FlightApiResponse = await response.json();
            if (apiResponse && Array.isArray(apiResponse.data)) {
              const validFlights = apiResponse.data.filter((f: any) =>
                f && typeof f.origin_airport === 'string' && typeof f.destination_airport === 'string'
                && typeof f.price === 'number' && typeof f.link === 'string'
              ).map((flight: any) => ({
                ...flight,
                stops: flight.transfers || 0,
                cabin_class: flight.cabin_class || 'economy',
                currency: flight.currency || 'USD',
                duration: flight.duration ? `${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m` : 'N/A'
              }));
              allFlights.push(...validFlights);
            } else {
              errors.push(`Received invalid data structure from server for ${origin} to ${destination}.`);
            }
          } catch (err: any) {
            errors.push(`An unexpected error occurred for ${origin} to ${destination}: ${err.message}`);
          }
        }
      }

      if (errors.length > 0) {
        setError(errors.join('; '));
      } else {
        setError(null);
      }
      setFlights(allFlights);
      setIsLoading(false);
    };

    fetchFlights();
  }, [searchParams]);

  // --- ADD BACK: Helper function to build the results page link ---
  const buildResultsLink = useCallback((params: SearchParamsType | null): string => {
    if (!params) return '#';
    const query = new URLSearchParams({
        originAirport: params.originAirport,
        destinationAirport: params.destinationAirport,
        departureDate: params.departureDate,
        adults: params.adults.toString(),
    });
    if (params.returnDate) {
        query.set('returnDate', params.returnDate);
    }
    return `/results?${query.toString()}`;
  }, []);

  // --- RESTORED: Full Render Logic ---

  // 1. Loading State
  if (isLoading) {
      return (
        <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
            <div className="container mx-auto px-4 text-center">
                <div className="inline-flex items-center justify-center gap-2 text-gray-600">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-t-blue-600 border-gray-300"></div>
                    <span>Loading flight deals...</span>
                </div>
            </div>
        </section>
      );
  }

  // 2. Error State
  if (error) {
      return (
          <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
              <div className="container mx-auto px-4">
                  <div className="text-center text-red-700 bg-red-100 p-4 rounded border border-red-300 max-w-md mx-auto">
                      <p className="font-semibold text-lg mb-1">Oops! Couldn't Load Flights</p>
                      <p className="text-sm">{error}</p>
                  </div>
              </div>
          </section>
      );
  }

  // 3. No Search Performed Yet
  if (!searchParams) {
      return null;
  }

  // 4. No Results Found
  if (flights.length === 0) {
      return (
          <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
              <div className="container mx-auto px-4">
                  <div className="text-center text-gray-600 py-10 bg-gray-50 rounded-lg max-w-lg mx-auto">
                      <p className="text-xl mb-2 font-medium">No flights found matching your criteria.</p>
                      <p className="text-sm">Consider adjusting your dates or airports in the search above.</p>
                  </div>
              </div>
          </section>
      );
  }

  // 5. Results Found - Render Flight Cards (RESTORED MAPPING)
  // Sort flights by price ascending
  const sortedFlights = [...flights].sort((a, b) => a.price - b.price);
  return (
    <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center md:text-left font-serif">
            Top Flight Deals Found
        </h2>
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Map over the first 3 flights and render FlightCard */}
          {sortedFlights.slice(0, 3).map((flight, index) => (
            <FlightCard
              key={flight.link ? `${flight.link}-${index}` : `flight-home-${index}`}
              flight={flight}
            />
          ))}

          {/* "See More Results" Button */}
          {sortedFlights.length > 3 && (
            <div className="text-center pt-4">
              <Link
                href={buildResultsLink(searchParams)}
                className="inline-block px-6 py-3 bg-blue-600 text-white text-lg rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors duration-200"
              >
                See All Results
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FlightResults;