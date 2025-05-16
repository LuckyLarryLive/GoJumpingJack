import React from 'react';
import type { Flight } from '@/types';

interface FlightTimelineProps {
  flight: Flight;
}

const FlightTimeline: React.FC<FlightTimelineProps> = ({ flight }) => {
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

  // Calculate duration in hours and minutes from two ISO strings
  const calculateDuration = (departure: string, arrival: string) => {
    const start = new Date(departure);
    const end = new Date(arrival);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 'N/A';
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Outbound
  const outboundDeparture = flight.departure_at || '';
  const outboundArrival = flight.return_at || flight.departure_at || '';
  const outboundDuration = calculateDuration(outboundDeparture, outboundArrival);

  // Return (if exists)
  const hasReturn = !!flight.return_at && flight.return_at !== flight.departure_at;
  // For round-trip, assume return departs from destination at return_at and arrives at origin at the same time (for now, as we don't have a separate arrival time)
  const returnDeparture = hasReturn ? flight.return_at || '' : '';
  const returnArrival = hasReturn ? flight.return_at || '' : '';
  const returnDuration = hasReturn ? calculateDuration(returnDeparture, returnArrival) : '';

  return (
    <div className="bg-blue-50 rounded-lg shadow-md p-6">
      <div className="flex flex-col gap-8">
        {/* Outbound Flight */}
        <div>
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Outbound Flight</h3>
          <div className="flex flex-row items-center gap-8">
            {/* Departure */}
            <div className="flex flex-col items-center">
              <span className="text-2xl">✈️</span>
              <div className="font-bold text-gray-900 mt-2">{flight.origin_airport}</div>
              <div className="text-sm text-gray-600">{formatTime(outboundDeparture)}</div>
              <div className="text-xs text-gray-500">{formatDate(outboundDeparture)}</div>
            </div>
            {/* Duration */}
            <div className="flex flex-col items-center">
              <span className="text-2xl">⏱</span>
              <div className="font-medium text-gray-700 mt-2">Flight Duration</div>
              <div className="text-sm text-gray-600">{outboundDuration}</div>
            </div>
            {/* Arrival */}
            <div className="flex flex-col items-center">
              <span className="text-2xl">🛬</span>
              <div className="font-bold text-gray-900 mt-2">{flight.destination_airport}</div>
              <div className="text-sm text-gray-600">{formatTime(outboundArrival)}</div>
              <div className="text-xs text-gray-500">{formatDate(outboundArrival)}</div>
            </div>
          </div>
        </div>
        {/* Return Flight */}
        {hasReturn && (
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Return Flight</h3>
            <div className="flex flex-row items-center gap-8">
              {/* Departure */}
              <div className="flex flex-col items-center">
                <span className="text-2xl">✈️</span>
                <div className="font-bold text-gray-900 mt-2">{flight.destination_airport}</div>
                <div className="text-sm text-gray-600">{formatTime(returnDeparture)}</div>
                <div className="text-xs text-gray-500">{formatDate(returnDeparture)}</div>
              </div>
              {/* Duration */}
              <div className="flex flex-col items-center">
                <span className="text-2xl">⏱</span>
                <div className="font-medium text-gray-700 mt-2">Flight Duration</div>
                <div className="text-sm text-gray-600">{returnDuration}</div>
              </div>
              {/* Arrival */}
              <div className="flex flex-col items-center">
                <span className="text-2xl">🛬</span>
                <div className="font-bold text-gray-900 mt-2">{flight.origin_airport}</div>
                <div className="text-sm text-gray-600">{formatTime(returnArrival)}</div>
                <div className="text-xs text-gray-500">{formatDate(returnArrival)}</div>
              </div>
            </div>
          </div>
        )}
        {/* Flight Details Horizontal */}
        <div className="mt-6 pt-6 border-t border-blue-200 flex flex-row flex-wrap gap-8 justify-center bg-blue-100 rounded-lg p-4">
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-sm font-medium text-blue-700">Airline</span>
            <p className="text-blue-900">{flight.airline}</p>
          </div>
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-sm font-medium text-blue-700">Cabin Class</span>
            <p className="text-blue-900 capitalize">{flight.cabin_class.replace('_', ' ')}</p>
          </div>
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-sm font-medium text-blue-700">Stops</span>
            <p className="text-blue-900">{flight.stops} {flight.stops === 1 ? 'stop' : 'stops'}</p>
          </div>
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-sm font-medium text-blue-700">Price</span>
            <p className="text-blue-900">{flight.currency} {flight.price.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightTimeline; 