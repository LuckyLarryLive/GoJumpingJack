// src/components/FlightCard.tsx
import React from 'react';
import Link from 'next/link';

// --- Type Definition (Import or define inline if not shared globally) ---
// Make sure this matches the type used in HomePage and API response
interface Flight {
  origin_airport: string;
  destination_airport: string;
  departure_at: string;
  return_at?: string;
  airline: string;
  price: number;
  link: string; // Assuming this is the unique identifier or booking link path
}

// --- Date Formatting Utility (Move to a utils file later for better organization) ---
// src/utils/dateUtils.ts would be ideal
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.error(`Invalid date value encountered in formatDate: "${dateString}"`);
            return 'Invalid Date';
        }
        // Consistent formatting
        return date.toLocaleDateString('en-US', {
            year: 'numeric', // Add year for clarity on results page
            month: 'short',
            day: 'numeric',
            hour: 'numeric', // Add time
            minute: '2-digit', // Add time
            // timeZone: 'UTC' // Keep or remove based on desired display (UTC vs user's local)
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
  // Basic validation
  if (!flight || !flight.origin_airport || !flight.destination_airport) {
    console.warn("Rendering FlightCard with incomplete data:", flight);
    return null; // Don't render if essential data is missing
  }

  return (
    <div
      className="flex flex-col md:flex-row items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow duration-200 gap-4 mb-4"
    >
      {/* Flight Details Column */}
      <div className="flex-grow flex flex-col sm:flex-row justify-between gap-4 w-full md:w-auto">
        {/* Origin/Destination */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{flight.origin_airport}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 flex-shrink-0">
             <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
          <span className="font-bold text-lg">{flight.destination_airport}</span>
        </div>
        {/* Dates */}
        <div className="text-sm text-gray-600 text-center sm:text-left flex flex-col">
          <span>Depart: {formatDate(flight.departure_at)}</span>
          {/* Only show Return date if it exists */}
          {flight.return_at && <span>Return: {formatDate(flight.return_at)}</span>}
        </div>
        {/* Airline */}
        <div className="text-sm text-gray-700 font-medium text-center sm:text-right flex-shrink-0 min-w-[100px]">{flight.airline}</div>
      </div>

      {/* Price & Link Column */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0 flex-shrink-0">
         <div className="text-center sm:text-right">
             <p className="text-xl font-bold text-blue-700">${flight.price.toFixed(2)}</p>
             <p className="text-xs text-gray-500">Total per person</p>
         </div>
         {/* Use a regular <a> tag for external links or if 'link' is a full URL */}
         {/* If 'link' is an internal path, use Next's <Link> */}
         <a
             href={flight.link} // Assume it's an external/partner link for now
             target="_blank"
             rel="noopener noreferrer"
             className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md transition duration-300 text-sm whitespace-nowrap"
         >
             View Deal
         </a>
      </div>
    </div>
  );
};

export default FlightCard;