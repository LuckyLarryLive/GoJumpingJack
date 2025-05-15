// src/app/results/ResultsContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import FlightCard from '@/components/FlightCard';
import type { Flight } from '@/types';

// --- Component ---
export default function ResultsContent() {
  const searchParamsHook = useSearchParams();

  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

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

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center gap-2 text-gray-600">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-t-blue-600 border-gray-300"></div>
            <span>Loading flight results...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return <div className="text-center py-10 text-red-600">Error: {error}</div>;
    }

    if (flights.length === 0) {
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
    const pageFlights = flights.slice(startIdx, endIdx);
    const totalPages = Math.ceil(flights.length / pageSize);
    return (
      <>
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