'use client'; // Required for useState, useEffect

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { SearchParamsType, Flight } from '@/types'; // Import shared types
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
  const [offerRequestId, setOfferRequestId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // --- Async Duffel Search Flow ---
  useEffect(() => {
    if (!searchParams) return;
    setIsLoading(true);
    setError(null);
    setFlights([]);
    setOfferRequestId(null);
    setTotalResults(0);
    setPolling(false);
    if (pollRef.current) clearTimeout(pollRef.current);

    // 1. Initiate search
    const initiate = async () => {
      try {
        const payload = {
          origin: searchParams.originAirport,
          destination: searchParams.destinationAirport,
          departureDate: searchParams.departureDate,
          returnDate: searchParams.returnDate,
          passengers: { adults: Number(searchParams.adults) },
          cabinClass: searchParams.cabinClass || 'economy',
        };
        console.log('[FlightResults] Initiating search with payload:', payload);
        const res = await fetch('/api/flights/initiate-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to initiate search');
        setOfferRequestId(data.offer_request_id);
        setPolling(true);
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    initiate();
    // Cleanup
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [searchParams]);

  // 2. Poll for results
  useEffect(() => {
    if (!offerRequestId || !polling) return;
    let stopped = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/flights/results?offer_request_id=${offerRequestId}`);
        const data = await res.json();
        if (data.status === 'pending') {
          setIsLoading(true);
          setFlights([]);
          setTotalResults(0);
          if (!stopped) pollRef.current = setTimeout(poll, 2000);
        } else if (data.status === 'complete') {
          setIsLoading(false);
          setFlights(data.offers || []);
          setTotalResults((data.meta && data.meta.total_count) || (data.offers ? data.offers.length : 0));
          setPolling(false);
        } else {
          setError(data.message || 'Unknown error');
          setIsLoading(false);
          setPolling(false);
        }
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
        setPolling(false);
      }
    };
    poll();
    return () => { stopped = true; if (pollRef.current) clearTimeout(pollRef.current); };
  }, [offerRequestId, polling]);

  // --- Helper function to build the results page link ---
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

  // --- Render Logic ---
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

  if (!searchParams) {
      return null;
  }

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