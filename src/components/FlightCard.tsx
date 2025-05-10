// src/components/FlightCard.tsx
import React from 'react';
import Link from 'next/link'; // Link import might not be needed if only using <a> for external links
import type { Flight } from '@/types';

// --- Date Formatting Utility ---
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.error(`Invalid date value encountered in formatDate: "${dateString}"`);
            return 'Invalid Date';
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
        });
    } catch (e) {
        console.error(`Error formatting date string "${dateString}":`, e);
        return 'Invalid Date';
    }
}

// --- Flight Card Component ---
interface FlightCardProps {
  flight: Flight;
}

const FlightCard: React.FC<FlightCardProps> = ({ flight }) => {
  if (!flight || !flight.origin_airport || !flight.destination_airport || !flight.link) {
    console.warn("Rendering FlightCard with incomplete data:", flight);
    return null; // Return null if essential data (including link) is missing
  }

  // Get base URL from environment variable
  // Provide an empty string fallback, although it should be set
  const baseUrl = process.env.NEXT_PUBLIC_FLIGHT_PROVIDER_BASE_URL || "";

  // Construct the full external URL using TravelPayouts base URL
  const externalFlightUrl = `${baseUrl}${flight.link}`;

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Calculate flight duration
  const calculateDuration = (departure: string, arrival: string) => {
    const start = new Date(departure);
    const end = new Date(arrival);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Calculate flight path width based on duration
  const getFlightPathWidth = (departure: string, arrival: string) => {
    const start = new Date(departure);
    const end = new Date(arrival);
    const durationMs = end.getTime() - start.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    // Base width on hours, with min and max constraints
    return Math.min(Math.max(hours * 50, 100), 300);
  };

  const departure = formatDateTime(flight.departure_at);
  const arrival = flight.return_at ? formatDateTime(flight.return_at) : null;
  const duration = calculateDuration(flight.departure_at, flight.return_at || flight.departure_at);
  const flightPathWidth = getFlightPathWidth(flight.departure_at, flight.return_at || flight.departure_at);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        {/* Flight Details */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            {/* Airline Logo */}
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-gray-600">{flight.airline.slice(0, 2)}</span>
            </div>
            
            {/* Flight Path */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-left">
                  <p className="font-bold text-lg">{flight.origin_airport}</p>
                  <p className="text-sm text-gray-600">{departure.time}</p>
                  <p className="text-xs text-gray-500">{departure.date}</p>
                </div>
                <div className="flex-1 px-4">
                  <div className="relative" style={{ width: `${flightPathWidth}px` }}>
                    <div className="h-0.5 bg-gray-300 w-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-white px-2">
                        <span className="text-xs text-gray-500">{duration}</span>
                      </div>
                    </div>
                    {flight.stops > 0 && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{flight.destination_airport}</p>
                  <p className="text-sm text-gray-600">{arrival?.time}</p>
                  <p className="text-xs text-gray-500">{arrival?.date}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{flight.stops} {flight.stops === 1 ? 'stop' : 'stops'}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{duration}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{flight.cabin_class}</span>
            </div>
          </div>
        </div>

        {/* Price and Book Button */}
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">
              {flight.currency} {flight.price.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">per person</p>
          </div>
          <a
            href={externalFlightUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition duration-300"
          >
            Book Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default FlightCard;