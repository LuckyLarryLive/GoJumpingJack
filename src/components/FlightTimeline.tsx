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

  const calculateDuration = (departure: string, arrival: string) => {
    const start = new Date(departure);
    const end = new Date(arrival);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const renderFlightSegment = (
    departureAirport: string,
    departureTime: string,
    arrivalAirport: string,
    arrivalTime: string,
    duration: string,
    isReturn: boolean = false
  ) => (
    <div className={`mb-6 ${isReturn ? 'mt-8' : ''}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {isReturn ? 'Return Flight' : 'Outbound Flight'}
      </h3>
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
        
        {/* Departure */}
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">✈️</span>
          </div>
          <div className="ml-4">
            <div className="text-xl font-bold text-gray-900">{departureAirport}</div>
            <div className="text-sm text-gray-600">{formatTime(departureTime)}</div>
            <div className="text-sm text-gray-500">{formatDate(departureTime)}</div>
          </div>
        </div>

        {/* Flight Duration */}
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">⏱</span>
          </div>
          <div className="ml-4">
            <div className="text-lg font-medium text-gray-700">Flight Duration</div>
            <div className="text-sm text-gray-600">{duration}</div>
          </div>
        </div>

        {/* Arrival */}
        <div className="flex items-start">
          <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🛬</span>
          </div>
          <div className="ml-4">
            <div className="text-xl font-bold text-gray-900">{arrivalAirport}</div>
            <div className="text-sm text-gray-600">{formatTime(arrivalTime)}</div>
            <div className="text-sm text-gray-500">{formatDate(arrivalTime)}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Outbound Flight */}
      {renderFlightSegment(
        flight.origin_airport,
        flight.departure_at,
        flight.destination_airport,
        flight.return_at || flight.departure_at,
        flight.duration
      )}

      {/* Return Flight (if exists) */}
      {flight.return_at && renderFlightSegment(
        flight.destination_airport,
        flight.return_at,
        flight.origin_airport,
        flight.return_at,
        calculateDuration(flight.return_at, flight.return_at),
        true
      )}

      {/* Flight Details */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Airline</span>
            <p className="text-gray-900">{flight.airline}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Cabin Class</span>
            <p className="text-gray-900 capitalize">{flight.cabin_class.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Stops</span>
            <p className="text-gray-900">{flight.stops} {flight.stops === 1 ? 'stop' : 'stops'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Price</span>
            <p className="text-gray-900">{flight.currency} {flight.price.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightTimeline; 