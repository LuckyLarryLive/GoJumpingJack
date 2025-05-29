// src/components/FlightCard.tsx
import React, { useState } from 'react';
import Link from 'next/link'; // Link import might not be needed if only using <a> for external links
import type { Flight } from '@/types';
import FlightTimeline from './FlightTimeline';
import { airports } from '@/lib/airports';
import type { Airport } from '@/types/airport';

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
  const [showTimeline, setShowTimeline] = useState(false);

  // Defensive: Ensure outbound_segments is an array with at least one element and required properties
  if (
    !flight ||
    !Array.isArray(flight.outbound_segments) ||
    flight.outbound_segments.length === 0 ||
    !flight.outbound_segments[0] ||
    !flight.outbound_segments[0].origin_airport ||
    !flight.outbound_segments[0].destination_airport ||
    !flight.link ||
    !flight.outbound_segments[0].departure_at
  ) {
    console.warn("Rendering FlightCard with incomplete data:", flight);
    return null; // Return null if essential data is missing
  }

  // Get origin and destination from first outbound segment
  const originAirport = flight.outbound_segments[0]?.origin_airport;
  const destinationAirport = flight.outbound_segments[0]?.destination_airport;
  const departureAt = flight.outbound_segments[0]?.departure_at;
  const returnAt = flight.return_segments?.[0]?.departure_at;

  // Get base URL from environment variable
  const baseUrl = process.env.NEXT_PUBLIC_FLIGHT_PROVIDER_BASE_URL || "";

  // Construct the full external URL using TravelPayouts base URL
  const externalFlightUrl = `${baseUrl}${flight.link}`;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get airport name from code
  const getAirportName = (code: string) => {
    const airport = airports.find((a: Airport) => a.code === code);
    return airport ? airport.name : code;
  };

  // Helper function to get airport city from code
  const getAirportCity = (code: string) => {
    const airport = airports.find((a: Airport) => a.code === code);
    return airport ? airport.city : code;
  };

  // Helper function to get segment duration in hours/minutes using UTC
  const getSegmentDuration = (departure: string, arrival: string) => {
    const start = new Date(departure);
    const end = new Date(arrival);
    let durationMs = end.getTime() - start.getTime();
    if (durationMs < 0) durationMs = 0;
    const totalMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getCabinClassLabel = (cabinClass: string) => {
    const labels: { [key: string]: string } = {
      'economy': 'Economy',
      'premium_economy': 'Premium Economy',
      'business': 'Business',
      'first': 'First Class'
    };
    return labels[cabinClass] || cabinClass;
  };

  // Calculate total duration from segments
  const calculateTotalDuration = () => {
    if (!Array.isArray(flight.outbound_segments) || !flight.outbound_segments.length) return 'N/A';
    const firstSegment = flight.outbound_segments[0];
    const lastSegment = flight.outbound_segments[flight.outbound_segments.length - 1];
    const start = new Date(firstSegment?.departure_at);
    const end = new Date(lastSegment?.arrival_at);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const summaryDuration = calculateTotalDuration();

  // Calculate flight path width based on duration
  const getFlightPathWidth = (departure: string, arrival: string) => {
    const start = new Date(departure);
    const end = new Date(arrival);
    const durationMs = end.getTime() - start.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    // Base width on hours, with min and max constraints
    return Math.min(Math.max(hours * 50, 100), 300);
  };

  const departureTime = formatTime(departureAt);
  const returnTime = returnAt ? formatTime(returnAt) : '';
  const departureDate = formatDate(departureAt);
  const flightPathWidth = getFlightPathWidth(departureAt, returnAt || departureAt);

  // Helper function to get airport/city display name
  const getDisplayName = (code: string) => {
    if (!code) return '';
    // If code is a 3-letter airport code, show airport name
    if (code.length === 3 && code.toUpperCase() === code) {
      const airport = airports.find((a: Airport) => a.code === code);
      return airport ? airport.name : code;
    }
    // Otherwise, treat as city name
    return code;
  };

  // Find the origin and destination airport codes for the main card
  // Always use full airport name and code for both origin and destination
  const mainOriginCode = flight.outbound_segments[0]?.origin_airport;
  const mainDestinationCode = flight.outbound_segments[flight.outbound_segments.length - 1]?.destination_airport;
  const mainOriginName = getAirportName(mainOriginCode);
  const mainDestinationName = getAirportName(mainDestinationCode);
  const mainOriginDisplay = `${mainOriginName} (${mainOriginCode})`;
  const mainDestinationDisplay = `${mainDestinationName} (${mainDestinationCode})`;

  // Summary line: use full airport name and code
  const summaryOriginDisplay = `${mainOriginName} (${mainOriginCode})`;
  const summaryDestinationDisplay = `${mainDestinationName} (${mainDestinationCode})`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-bold flex items-center gap-2 max-w-[40ch] truncate" title={`${mainOriginDisplay} → ${mainDestinationDisplay}`}>{mainOriginDisplay} <span className="mx-1">→</span> {mainDestinationDisplay}</div>
                <div className="text-sm text-gray-500">
                  {summaryOriginDisplay} → {summaryDestinationDisplay}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(departureAt)} at {formatTime(departureAt)}
                  {returnAt && (
                    <span> • Return: {formatDate(returnAt)} at {formatTime(returnAt)}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600">
                  <span style={{ whiteSpace: 'nowrap' }}>{flight.currency === 'USD' ? '$' : flight.currency}{flight.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {flight.airline} • {flight.stops} {flight.stops === 1 ? 'stop' : 'stops'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="w-full mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center"
        >
          {showTimeline ? 'Hide Details' : 'View Details'}
          <svg
            className={`ml-1 w-4 h-4 transform transition-transform ${showTimeline ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showTimeline && (
          <div className="mt-4 border-t pt-4">
            <div className="space-y-4">
              {/* Outbound Flight */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">Outbound Flight</h3>
                <div className="text-xs text-center text-gray-500 mb-2">{summaryDuration}</div>
                {flight.outbound_segments.map((segment, index) => (
                  <div key={index} className="flex flex-col items-center mb-2">
                    <div className="flex items-center justify-center w-full">
                      <div className="w-24 text-sm text-center">{formatTime(segment.departure_at)}</div>
                      <div className="flex-1 px-4 relative">
                        <div className="h-0.5 bg-gray-300 relative">
                          <div className="absolute -top-1.5 left-0 w-3 h-3 rounded-full bg-blue-500"></div>
                          <div className="absolute -top-1.5 right-0 w-3 h-3 rounded-full bg-blue-500"></div>
                        </div>
                      </div>
                      <div className="w-24 text-sm text-center">{formatTime(segment.arrival_at)}</div>
                    </div>
                    <div className="flex justify-center text-xs text-gray-500 mt-1 items-center">
                      <span className="mx-2" title={getAirportName(segment.origin_airport)}>
                        {getAirportName(segment.origin_airport)} ({segment.origin_airport})
                      </span>
                      <span className="mx-1">✈️</span>
                      <span className="mx-2" title={getAirportName(segment.destination_airport)}>
                        {getAirportName(segment.destination_airport)} ({segment.destination_airport})
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Return Flight */}
              {flight.return_segments && flight.return_segments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">Return Flight</h3>
                  <div className="text-xs text-center text-gray-500 mb-2">{summaryDuration}</div>
                  {flight.return_segments.map((segment, index) => (
                    <div key={index} className="flex flex-col items-center mb-2">
                      <div className="flex items-center justify-center w-full">
                        <div className="w-24 text-sm text-center">{formatTime(segment.departure_at)}</div>
                        <div className="flex-1 px-4 relative">
                          <div className="h-0.5 bg-gray-300 relative">
                            <div className="absolute -top-1.5 left-0 w-3 h-3 rounded-full bg-blue-500"></div>
                            <div className="absolute -top-1.5 right-0 w-3 h-3 rounded-full bg-blue-500"></div>
                          </div>
                        </div>
                        <div className="w-24 text-sm text-center">{formatTime(segment.arrival_at)}</div>
                      </div>
                      <div className="flex justify-center text-xs text-gray-500 mt-1 items-center">
                        <span className="mx-2" title={getAirportName(segment.origin_airport)}>
                          {getAirportName(segment.origin_airport)} ({segment.origin_airport})
                        </span>
                        <span className="mx-1">✈️</span>
                        <span className="mx-2" title={getAirportName(segment.destination_airport)}>
                          {getAirportName(segment.destination_airport)} ({segment.destination_airport})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightCard;