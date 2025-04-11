// src/app/results/ResultsContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import FlightCard from '@/components/FlightCard'; // Adjust path if needed

// --- Type Definitions (ensure consistency) ---
interface Flight {
  origin_airport: string;
  destination_airport: string;
  departure_at: string;
  return_at?: string;
  airline: string;
  price: number;
  link: string;
}

// Assumed API response structure
interface FlightApiResponse {
  data: Flight[];
  // Add other potential fields your API might return if needed
}

// --- Component ---
export default function ResultsContent() {
  const searchParamsHook = useSearchParams(); // Renamed to avoid conflict

  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading
  const [error, setError] = useState<string | null>(null);

  // Extract search params (use names consistent with API and HomePage link)
  const originAirport = searchParamsHook.get('originAirport');
  const destinationAirport = searchParamsHook.get('destinationAirport');
  const departureDate = searchParamsHook.get('departureDate');
  const returnDate = searchParamsHook.get('returnDate'); // Might be null
  const adults = searchParamsHook.get('adults');

  useEffect(() => {
    // Ensure essential parameters are present
    if (!originAirport || !destinationAirport || !departureDate || !adults) {
      setError("Missing essential search criteria in URL.");
      setIsLoading(false);
      setFlights([]);
      return; // Stop fetching if params are missing
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

        // Assuming the API returns { data: Flight[] } structure
        const apiResponse: FlightApiResponse = await response.json();
        console.log('Raw Flight API Response (Results Page):', apiResponse);

        if (apiResponse && Array.isArray(apiResponse.data)) {
            const validFlights = apiResponse.data.filter((f: any) =>
                f && typeof f.origin_airport === 'string' && typeof f.destination_airport === 'string'
                // Add other essential field checks if needed
            );
            setFlights(validFlights);
            console.log(`Successfully set ${validFlights.length} flights on results page.`);
        } else {
            console.error("API response is missing 'data' array or invalid structure.", apiResponse);
            setFlights([]); // Ensure flights is empty array on error
        }
        setError(null); // Clear previous errors

      } catch (err: any) {
        console.error("Failed to fetch or process flights on results page:", err);
        setError(err.message || 'Failed to fetch flight data.');
        setFlights([]); // Ensure flights is empty array on error
      } finally {
        setIsLoading(false);
        console.log("Finished flight fetch attempt on results page.");
      }
    };

    fetchFlights();

  // Re-run effect if any search parameter changes
  }, [originAirport, destinationAirport, departureDate, returnDate, adults]);

  // --- Render Logic ---

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center py-10">Loading flight results...</div>;
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

    return (
      <div className="space-y-4">
        {flights.map((flight, index) => (
          // Use a combination of link/index or a truly unique ID if available from API
          <FlightCard key={`${flight.link || 'flight-result'}-${index}`} flight={flight} />
        ))}
      </div>
    );
  };

  return (
    // Add padding and container for layout
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        Flight Results
        {/* Optionally display search criteria */}
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