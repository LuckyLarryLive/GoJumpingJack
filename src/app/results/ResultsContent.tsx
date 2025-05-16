// src/app/results/ResultsContent.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import FlightCard from '@/components/FlightCard';
import type { Flight } from '@/types';

const unique = (arr: string[]) => Array.from(new Set(arr));

// --- Component ---
export default function ResultsContent() {
  const searchParamsHook = useSearchParams();

  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [priceFilter, setPriceFilter] = useState<[number, number] | null>(null);
  const [cabinClassFilter, setCabinClassFilter] = useState<string>('');
  const [airlineFilter, setAirlineFilter] = useState<string>('');
  const pageSize = 10;
  const [showLoadingVideo, setShowLoadingVideo] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract search params
  const originAirport = searchParamsHook.get('originAirport');
  const destinationAirport = searchParamsHook.get('destinationAirport');
  const departureDate = searchParamsHook.get('departureDate');
  const returnDate = searchParamsHook.get('returnDate');
  const adults = searchParamsHook.get('adults');
  const cabinClass = searchParamsHook.get('cabinClass');
  const currency = searchParamsHook.get('currency');

  useEffect(() => {
    // Ensure essential parameters are present
    if (!originAirport || !destinationAirport || !departureDate || !adults) {
      setError("Missing essential search criteria in URL.");
      setIsLoading(false);
      setFlights([]);
      return;
    }

    const fetchFlights = async () => {
      setIsLoading(true);
      setError(null);
      setFlights([]);

      // Construct the query params for the API call
      const query = new URLSearchParams({
        originAirport,
        destinationAirport,
        departureDate,
        adults,
      });

      if (returnDate) {
        query.set('returnDate', returnDate);
      }
      if (cabinClass) {
        query.set('cabinClass', cabinClass);
      }
      if (currency) {
        query.set('currency', currency);
      }

      console.log(`ResultsPage fetching flights: /api/flights?${query.toString()}`);

      try {
        const response = await fetch(`/api/flights?${query.toString()}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response Text:", errorText);
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const responseText = await response.text();
          console.error("Received non-JSON response:", responseText);
          throw new Error(`Expected JSON response, but got ${contentType}`);
        }

        const apiResponse = await response.json();
        console.log('Raw Flight API Response (Results Page):', apiResponse);

        if (apiResponse && Array.isArray(apiResponse.data)) {
          setFlights(apiResponse.data);
          console.log(`Successfully set ${apiResponse.data.length} flights on results page.`);
        } else {
          console.error("API response is missing 'data' array or invalid structure.", apiResponse);
          setFlights([]);
        }
        setError(null);

      } catch (err: any) {
        console.error("Failed to fetch or process flights on results page:", err);
        setError(err.message || 'Failed to fetch flight data.');
        setFlights([]);
      } finally {
        setIsLoading(false);
        console.log("Finished flight fetch attempt on results page.");
      }
    };

    fetchFlights();

  }, [originAirport, destinationAirport, departureDate, returnDate, adults, cabinClass, currency]);

  useEffect(() => {
    setPage(1); // Reset to first page if search params change
  }, [originAirport, destinationAirport, departureDate, returnDate, adults, cabinClass, currency]);

  useEffect(() => {
    if (isLoading) {
      setShowLoadingVideo(true);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = setTimeout(() => {
        setShowLoadingVideo(false);
      }, 4000);
    } else {
      // Only hide the video if 4s have passed
      if (loadingTimeoutRef.current) {
        setTimeout(() => setShowLoadingVideo(false), 0);
      } else {
        setShowLoadingVideo(false);
      }
    }
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [isLoading]);

  // --- Filtering and Sorting ---
  const sortedFlights = [...flights].sort((a, b) => a.price - b.price);
  const minPrice = sortedFlights.length ? sortedFlights[0].price : 0;
  const maxPrice = sortedFlights.length ? sortedFlights[sortedFlights.length - 1].price : 0;
  const filteredFlights = sortedFlights.filter(flight => {
    let pass = true;
    if (priceFilter) {
      pass = pass && flight.price >= priceFilter[0] && flight.price <= priceFilter[1];
    }
    if (cabinClassFilter) {
      pass = pass && flight.cabin_class === cabinClassFilter;
    }
    if (airlineFilter) {
      pass = pass && flight.airline === airlineFilter;
    }
    return pass;
  });

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading || showLoadingVideo) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <video
            src="/Jack_Finding_Flights.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '320px', maxWidth: '90%', borderRadius: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
          />
          <span className="mt-4 text-lg text-blue-700 font-semibold">Jack is finding the best flights for you...</span>
        </div>
      );
    }

    if (error) {
      return <div className="text-center py-10 text-red-600">Error: {error}</div>;
    }

    if (filteredFlights.length === 0) {
      return (
        <div className="text-center text-gray-600 py-10">
          <p className="text-xl mb-2">No flights found matching your criteria.</p>
          <p>Please try adjusting your search on the <a href="/" className="text-blue-600 hover:underline">homepage</a>.</p>
        </div>
      );
    }

    // Pagination logic
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageFlights = filteredFlights.slice(startIdx, endIdx);
    const totalPages = Math.ceil(filteredFlights.length / pageSize);
    return (
      <>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          {/* Price Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={minPrice}
                max={maxPrice}
                value={priceFilter ? priceFilter[0] : minPrice}
                onChange={e => setPriceFilter([Number(e.target.value), priceFilter ? priceFilter[1] : maxPrice])}
                className="w-20 p-1 border border-gray-300 rounded"
              />
              <span>-</span>
              <input
                type="number"
                min={minPrice}
                max={maxPrice}
                value={priceFilter ? priceFilter[1] : maxPrice}
                onChange={e => setPriceFilter([priceFilter ? priceFilter[0] : minPrice, Number(e.target.value)])}
                className="w-20 p-1 border border-gray-300 rounded"
              />
              <button
                className="ml-2 px-2 py-1 bg-gray-200 rounded"
                onClick={() => setPriceFilter(null)}
                disabled={!priceFilter}
              >Clear</button>
            </div>
          </div>
          {/* Cabin Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cabin Class</label>
            <select
              value={cabinClassFilter}
              onChange={e => setCabinClassFilter(e.target.value)}
              className="p-1 border border-gray-300 rounded"
            >
              <option value="">All</option>
              {unique(sortedFlights.map(f => f.cabin_class)).map(cabin => (
                <option key={cabin} value={cabin}>{cabin.charAt(0).toUpperCase() + cabin.slice(1).replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          {/* Airline Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Airline</label>
            <select
              value={airlineFilter}
              onChange={e => setAirlineFilter(e.target.value)}
              className="p-1 border border-gray-300 rounded"
            >
              <option value="">All</option>
              {unique(sortedFlights.map(f => f.airline)).map(airline => (
                <option key={airline} value={airline}>{airline}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-4">
          {pageFlights.map((flight, index) => (
            <FlightCard key={`${flight.link || 'flight-result'}-${startIdx + index}`} flight={flight} />
          ))}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-gray-700">Page {page} of {totalPages}</span>
            <button
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        Flight Results
        {originAirport && destinationAirport && (
          <span className="block text-lg font-normal text-gray-600 mt-1">
            For: {originAirport} to {destinationAirport}
          </span>
        )}
      </h1>
      {renderContent()}
    </div>
  );
}