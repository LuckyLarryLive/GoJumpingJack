'use client'; // Required for useState, useEffect

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { SearchParamsType, Flight, FlightApiResponse } from '@/types'; // Import shared types
import FlightCard from './FlightCard'; // <--- ADD BACK FlightCard Import
import { useRouter } from 'next/navigation';
import { FaPlane, FaArrowRight, FaClock, FaMoneyBillWave } from 'react-icons/fa';

// --- Component Props Interface ---
interface FlightResultsProps {
  searchParams?: SearchParamsType | null;
  apiUrl?: string;
  showPagination?: boolean;
  onPageChange?: (page: number) => void;
  currentPage?: number;
}

// --- Flight Results Component ---
const FlightResults: React.FC<FlightResultsProps> = ({ 
  searchParams, 
  apiUrl,
  showPagination = false, 
  onPageChange, 
  currentPage = 1 
}) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const router = useRouter();

  // --- Fetch Logic ---
  useEffect(() => {
    const fetchFlights = async () => {
      setIsLoading(true);
      setError(null);
      setFlights([]);

      try {
        // If apiUrl is provided, use it directly
        if (apiUrl) {
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
          }
          const data = await response.json();
          setFlights(data.data || []);
          setTotalResults(data.total || 0);
          return;
        }

        // Otherwise, use the searchParams logic
        if (!searchParams) {
          setFlights([]);
          setError(null);
          setIsLoading(false);
          return;
        }

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
              limit: showPagination ? '10' : '3', // Use 10 for pagination, 3 for initial view
              sort: 'price',
            });
            if (searchParams.returnDate) {
              query.set('returnDate', searchParams.returnDate);
            }

            try {
              const response = await fetch(`/api/flights?${query.toString()}`);
              if (!response.ok) {
                const errorText = await response.text();
                errors.push(`Search failed for ${origin} to ${destination}: ${response.statusText}`);
                continue;
              }
              const data = await response.json();
              if (data && Array.isArray(data.data)) {
                allFlights.push(...data.data);
                setTotalResults(data.total || 0);
              }
            } catch (err: any) {
              errors.push(`Error for ${origin} to ${destination}: ${err.message}`);
            }
          }
        }

        if (errors.length > 0) {
          setError(errors.join('; '));
        }
        setFlights(allFlights);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlights();
  }, [searchParams, apiUrl, showPagination]);

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

  const handleSeeAllFlights = () => {
    if (!searchParams) return;
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    router.push(`/flights?${params.toString()}`);
  };

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

  // 5. Results Found - Render Flight Cards
  const sortedFlights = [...flights].sort((a, b) => a.price - b.price);
  const displayedFlights = showPagination ? sortedFlights : sortedFlights.slice(0, 3);
  const totalPages = Math.ceil(totalResults / 10);

  return (
    <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center md:text-left font-serif">
          {showPagination ? 'All Flight Deals' : 'Top Flight Deals Found'}
        </h2>
        <div className="space-y-4 max-w-4xl mx-auto">
          {displayedFlights.map((flight, index) => (
            <FlightCard
              key={flight.link ? `${flight.link}-${index}` : `flight-home-${index}`}
              flight={flight}
            />
          ))}

          {/* "See More Results" Button */}
          {!showPagination && totalResults > 3 && (
            <div className="text-center pt-6">
              <button
                onClick={handleSeeAllFlights}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                See All {totalResults} Flights
                <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {showPagination && totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <button
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FlightResults;