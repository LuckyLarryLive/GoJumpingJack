import React from 'react';
import type { Flight, FlightSegment } from '@/types';

interface FlightTimelineProps {
  flight: Flight;
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const calculateLayover = (prevArrival: string, nextDeparture: string) => {
  const prev = new Date(prevArrival);
  const next = new Date(nextDeparture);
  if (isNaN(prev.getTime()) || isNaN(next.getTime()) || next <= prev) return null;
  const ms = next.getTime() - prev.getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const renderSegments = (segments: FlightSegment[], direction: 'Outbound' | 'Return') => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-blue-900 mb-4">{direction} Flight</h3>
    <div className="flex flex-row items-center gap-8 flex-wrap">
      {segments.map((seg, idx) => (
        <React.Fragment key={idx}>
          {/* Departure */}
          <div className="flex flex-col items-center">
            <span className="text-2xl">✈️</span>
            <div className="font-bold text-gray-900 mt-2">{seg.origin_airport}</div>
            <div className="text-sm text-gray-600">{formatTime(seg.departure_at)}</div>
            <div className="text-xs text-gray-500">{formatDate(seg.departure_at)}</div>
          </div>
          {/* Flight Duration */}
          <div className="flex flex-col items-center">
            <span className="text-2xl">⏱</span>
            <div className="font-medium text-gray-700 mt-2">Flight Duration</div>
            <div className="text-sm text-gray-600">{seg.duration}</div>
          </div>
          {/* Arrival */}
          <div className="flex flex-col items-center">
            <span className="text-2xl">🛬</span>
            <div className="font-bold text-gray-900 mt-2">{seg.destination_airport}</div>
            <div className="text-sm text-gray-600">{formatTime(seg.arrival_at)}</div>
            <div className="text-xs text-gray-500">{formatDate(seg.arrival_at)}</div>
          </div>
          {/* Layover (if not last segment) */}
          {idx < segments.length - 1 && (
            <div className="flex flex-col items-center">
              <span className="text-2xl">⏱</span>
              <div className="font-medium text-gray-700 mt-2">Layover</div>
              <div className="text-sm text-gray-600">
                {calculateLayover(seg.arrival_at, segments[idx + 1].departure_at)}
              </div>
              <div className="text-xs text-gray-500">at {segments[idx + 1].origin_airport}</div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const FlightTimeline: React.FC<FlightTimelineProps> = ({ flight }) => {
  return (
    <div className="bg-blue-50 rounded-lg shadow-md p-6">
      <div className="flex flex-col gap-8">
        {flight.outbound_segments &&
          flight.outbound_segments.length > 0 &&
          renderSegments(flight.outbound_segments, 'Outbound')}
        {flight.return_segments &&
          flight.return_segments.length > 0 &&
          renderSegments(flight.return_segments, 'Return')}
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
            <p className="text-blue-900">
              {flight.stops} {flight.stops === 1 ? 'stop' : 'stops'}
            </p>
          </div>
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-sm font-medium text-blue-700">Price</span>
            <p className="text-blue-900">
              {typeof flight.price === 'number'
                ? `${flight.currency} ${flight.price.toLocaleString()}`
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightTimeline;
