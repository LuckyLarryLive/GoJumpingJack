// src/components/FlightCard.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Flight } from '@/types';
import { airports } from '@/lib/airports';
import type { Airport } from '@/types/airport';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatPrice } from '@/lib/currency';

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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (e) {
    console.error(`Error formatting date string "${dateString}":`, e);
    return 'Invalid Date';
  }
};

// --- Flight Card Component ---
interface FlightCardProps {
  flight: Flight;
}

const FlightCard: React.FC<FlightCardProps> = ({ flight }) => {
  const [showTimeline, setShowTimeline] = useState(false);
  const router = useRouter();
  const { currency } = useCurrency();

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
    console.warn('Rendering FlightCard with incomplete data:', flight);
    return null; // Return null if essential data is missing
  }

  // Get origin and destination from first outbound segment
  const originAirport = flight.outbound_segments[0]?.origin_airport;
  const destinationAirport = flight.outbound_segments[0]?.destination_airport;
  const departureAt = flight.outbound_segments[0]?.departure_at;
  const returnAt = flight.return_segments?.[0]?.departure_at;

  // Handle click to navigate to offer details
  const handleOfferClick = () => {
    // The flight.link contains the offer_id from Duffel
    router.push(`/flights/offer/${flight.link}`);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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

  // Helper to get display string for an airport code
  const getAirportDisplay = (code: string) => {
    const airport = airports.find((a: Airport) => a.code === code);
    return airport ? `${airport.name} (${code})` : code;
  };

  // Main card header: use best available info
  const summaryOriginDisplay = getAirportDisplay(originAirport);
  const summaryDestinationDisplay = getAirportDisplay(destinationAirport);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 w-full">
      <div className="p-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-2">
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 w-full">
              <div className="w-full">
                <div
                  className="font-bold flex items-center gap-2 max-w-full truncate text-base sm:text-lg"
                  title={`${summaryOriginDisplay} → ${summaryDestinationDisplay}`}
                >
                  {getAirportDisplay(originAirport)} <span className="mx-1">→</span>{' '}
                  {getAirportDisplay(destinationAirport)}
                </div>
                <div className="text-sm text-gray-500 max-w-full break-words">
                  {originAirport} → {destinationAirport}
                </div>
                <div className="text-sm text-gray-600 max-w-full break-words">
                  {formatDate(departureAt)} at {formatTime(departureAt)}
                  {returnAt && (
                    <span>
                      {' '}
                      • Return: {formatDate(returnAt)} at {formatTime(returnAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right w-full sm:w-auto mt-2 sm:mt-0">
                <div className="text-xl font-bold text-blue-600">
                  <span style={{ whiteSpace: 'nowrap' }}>
                    {formatPrice(flight.price, currency)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {flight.airline} • {flight.stops} {flight.stops === 1 ? 'stop' : 'stops'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <button
            onClick={handleOfferClick}
            className="w-full text-white bg-blue-600 hover:bg-blue-700 text-base sm:text-sm font-medium flex items-center justify-center py-3 rounded-lg transition-all"
          >
            View Full Details & Book
          </button>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="w-full text-blue-600 hover:text-blue-800 text-base sm:text-sm font-medium flex items-center justify-center py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all"
          >
            {showTimeline ? 'Hide Timeline' : 'Show Timeline'}
            <svg
              className={`ml-1 w-4 h-4 transform transition-transform ${showTimeline ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {showTimeline && (
          <div className="mt-4 border-t pt-4 w-full">
            <div className="space-y-4 w-full">
              {/* Outbound Flight */}
              <div>
                <h3 className="text-base sm:text-sm font-semibold text-gray-700 mb-2 text-center">
                  Outbound Flight
                </h3>
                <div className="text-xs text-center text-gray-500 mb-2">{summaryDuration}</div>
                {flight.outbound_segments.map((segment, index) => (
                  <div key={index} className="flex flex-col items-center mb-2 w-full">
                    <div className="flex items-center justify-center w-full">
                      <div className="w-20 sm:w-24 text-xs sm:text-sm text-center">
                        {formatTime(segment.departure_at)}
                      </div>
                      <div className="flex-1 px-2 sm:px-4 relative">
                        <div className="h-0.5 bg-gray-300 relative">
                          <div className="absolute -top-1.5 left-0 w-3 h-3 rounded-full bg-blue-500"></div>
                          <div className="absolute -top-1.5 right-0 w-3 h-3 rounded-full bg-blue-500"></div>
                        </div>
                      </div>
                      <div className="w-20 sm:w-24 text-xs sm:text-sm text-center">
                        {formatTime(segment.arrival_at)}
                      </div>
                    </div>
                    <div className="flex justify-center text-xs text-gray-500 mt-1 items-center flex-wrap w-full">
                      <span className="mx-2" title={getAirportDisplay(segment.origin_airport)}>
                        {getAirportDisplay(segment.origin_airport)}
                      </span>
                      <span className="mx-1">✈️</span>
                      <span className="mx-2" title={getAirportDisplay(segment.destination_airport)}>
                        {getAirportDisplay(segment.destination_airport)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Return Flight */}
              {flight.return_segments && flight.return_segments.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-sm font-semibold text-gray-700 mb-2 text-center">
                    Return Flight
                  </h3>
                  <div className="text-xs text-center text-gray-500 mb-2">{summaryDuration}</div>
                  {flight.return_segments.map((segment, index) => (
                    <div key={index} className="flex flex-col items-center mb-2 w-full">
                      <div className="flex items-center justify-center w-full">
                        <div className="w-20 sm:w-24 text-xs sm:text-sm text-center">
                          {formatTime(segment.departure_at)}
                        </div>
                        <div className="flex-1 px-2 sm:px-4 relative">
                          <div className="h-0.5 bg-gray-300 relative">
                            <div className="absolute -top-1.5 left-0 w-3 h-3 rounded-full bg-blue-500"></div>
                            <div className="absolute -top-1.5 right-0 w-3 h-3 rounded-full bg-blue-500"></div>
                          </div>
                        </div>
                        <div className="w-20 sm:w-24 text-xs sm:text-sm text-center">
                          {formatTime(segment.arrival_at)}
                        </div>
                      </div>
                      <div className="flex justify-center text-xs text-gray-500 mt-1 items-center flex-wrap w-full">
                        <span className="mx-2" title={getAirportDisplay(segment.origin_airport)}>
                          {getAirportDisplay(segment.origin_airport)}
                        </span>
                        <span className="mx-1">✈️</span>
                        <span
                          className="mx-2"
                          title={getAirportDisplay(segment.destination_airport)}
                        >
                          {getAirportDisplay(segment.destination_airport)}
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
