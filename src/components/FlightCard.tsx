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
  if (!flight || !flight.origin_airport || !flight.destination_airport) {
    console.warn("Rendering FlightCard with incomplete data:", flight);
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow duration-200 gap-4 mb-4">
        {/* Flight Details Column */}
        <div className="flex-grow flex flex-col sm:flex-row justify-between gap-4 w-full md:w-auto">

            {/* Origin/Destination */}
            <div className="flex items-center gap-2">
              {/* --- RESTORED CONTENT --- */}
              <span className="font-bold text-lg">{flight.origin_airport}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 flex-shrink-0">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
              <span className="font-bold text-lg">{flight.destination_airport}</span>
              {/* --- END RESTORED --- */}
            </div>

            {/* Dates */}
            <div className="text-sm text-gray-600 text-center sm:text-left flex flex-col">
              {/* --- RESTORED CONTENT --- */}
              <span>Depart: {formatDate(flight.departure_at)}</span>
              {flight.return_at && <span>Return: {formatDate(flight.return_at)}</span>}
              {/* --- END RESTORED --- */}
            </div>

            {/* Airline */}
            <div className="text-sm text-gray-700 font-medium text-center sm:text-right flex-shrink-0 min-w-[100px]">
              {/* --- RESTORED CONTENT --- */}
              {flight.airline}
              {/* --- END RESTORED --- */}
            </div>
        </div>

        {/* Price & Link Column */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0 flex-shrink-0">
            {/* --- RESTORED CONTENT --- */}
             <div className="text-center sm:text-right">
                 <p className="text-xl font-bold text-blue-700">${flight.price.toFixed(2)}</p>
                 <p className="text-xs text-gray-500">Total per person</p>
             </div>
             <a
                 href={flight.link}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md transition duration-300 text-sm whitespace-nowrap"
             >
                 View Deal
             </a>
            {/* --- END RESTORED --- */}
        </div>
    </div>
  );
};

export default FlightCard;