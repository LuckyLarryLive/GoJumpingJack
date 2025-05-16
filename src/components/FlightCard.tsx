// src/components/FlightCard.tsx
import React, { useState } from 'react';
import Link from 'next/link'; // Link import might not be needed if only using <a> for external links
import type { Flight } from '@/types';
import FlightTimeline from './FlightTimeline';

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

  if (!flight || !flight.origin_airport || !flight.destination_airport || !flight.link) {
    console.warn("Rendering FlightCard with incomplete data:", flight);
    return null; // Return null if essential data (including link) is missing
  }

  // Get base URL from environment variable
  // Provide an empty string fallback, although it should be set
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

  const getCabinClassLabel = (cabinClass: string) => {
    const labels: { [key: string]: string } = {
      'economy': 'Economy',
      'premium_economy': 'Premium Economy',
      'business': 'Business',
      'first': 'First Class'
    };
    return labels[cabinClass] || cabinClass;
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

  const departureTime = formatTime(flight.departure_at);
  const returnTime = flight.return_at ? formatTime(flight.return_at) : '';
  const departureDate = formatDate(flight.departure_at);
  const duration = calculateDuration(flight.departure_at, flight.return_at || flight.departure_at);
  const flightPathWidth = getFlightPathWidth(flight.departure_at, flight.return_at || flight.departure_at);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Flight Summary */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="text-lg font-semibold text-gray-900">
                {flight.origin_airport} → {flight.destination_airport}
              </div>
              <div className="text-sm text-gray-600">
                {formatDate(flight.departure_at)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {flight.currency} {flight.price.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {flight.cabin_class && getCabinClassLabel(flight.cabin_class)}
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div>
              <span className="font-medium">Departure:</span> {formatTime(flight.departure_at)}
            </div>
            {flight.return_at && (
              <div>
                <span className="font-medium">Return:</span> {formatTime(flight.return_at)}
              </div>
            )}
            <div>
              <span className="font-medium">Duration:</span> {flight.duration}
            </div>
            <div>
              <span className="font-medium">Stops:</span> {flight.stops}
            </div>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            {showTimeline ? 'Hide Details' : 'View Details'}
            <span className="transform transition-transform duration-200">
              {showTimeline ? '↑' : '↓'}
            </span>
          </button>
        </div>

        {/* Book Button */}
        <div className="w-full md:w-auto">
          <a
            href={externalFlightUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full md:w-auto px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book Now
          </a>
        </div>
      </div>

      {/* Timeline View */}
      {showTimeline && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <FlightTimeline flight={flight} />
        </div>
      )}
    </div>
  );
};

export default FlightCard;