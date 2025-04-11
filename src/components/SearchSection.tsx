'use client'; // Essential for components using hooks like useState, useEffect

import React, { useState, useEffect, useCallback } from 'react';
import type { SearchParamsType } from '@/types'; // Import shared type
import AirportSearchInput from './AirportSearchInput'; // Import sibling component

// --- Component Props Interface ---
// (Part of the code you cut and pasted)
interface SearchSectionProps {
  onSearchSubmit: (params: SearchParamsType) => void;
  initialSearchParams?: SearchParamsType | null; // Used for pre-filling or resetting
}

// --- Search Section Component ---
// (The main component code you cut and pasted)
const SearchSection: React.FC<SearchSectionProps> = ({ onSearchSubmit, initialSearchParams }) => {
  // --- State variables ---
  const [originAirportCode, setOriginAirportCode] = useState<string | null>(null);
  const [destinationAirportCode, setDestinationAirportCode] = useState<string | null>(null);
  const [fromDisplayValue, setFromDisplayValue] = useState<string | null>(null);
  const [toDisplayValue, setToDisplayValue] = useState<string | null>(null);
  const [departureDate, setDepartureDate] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [travelers, setTravelers] = useState<string>('1'); // Default to 1 traveler
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip'); // Default trip type
  const [isMinimized, setIsMinimized] = useState(false); // Controls expanded/minimized view

  // Calculate today's date for min attribute on date inputs
  const today = new Date().toISOString().split('T')[0];

  // --- Effect for resetting or pre-filling the form based on initialSearchParams ---
  useEffect(() => {
    console.log("SearchSection initialSearchParams changed:", initialSearchParams); // Log changes
    if (initialSearchParams === null) {
        // Explicitly Reset the form fully
        console.log("SearchSection: Resetting form.");
        setOriginAirportCode(null);
        setDestinationAirportCode(null);
        setFromDisplayValue(null);
        setToDisplayValue(null);
        setDepartureDate('');
        setReturnDate('');
        setTravelers('1');
        setTripType('round-trip');
        setIsMinimized(false); // Ensure form is expanded on reset
    } else if (initialSearchParams) {
        // Pre-fill the form
        console.log("SearchSection: Pre-filling form.");
        setOriginAirportCode(initialSearchParams.originAirport);
        setDestinationAirportCode(initialSearchParams.destinationAirport);
        // Use display values from params if available, otherwise clear them
        setFromDisplayValue(initialSearchParams.fromDisplayValue || null);
        setToDisplayValue(initialSearchParams.toDisplayValue || null);
        setDepartureDate(initialSearchParams.departureDate);
        setReturnDate(initialSearchParams.returnDate || '');
        setTravelers(initialSearchParams.travelers);
        setTripType(initialSearchParams.tripType);
        // Optionally minimize if pre-filled? Depends on desired UX
        setIsMinimized(true); // Example: Minimize when pre-filled from results page link
    }
    // If initialSearchParams is undefined (initial load, no params), do nothing, keep defaults
  }, [initialSearchParams]); // Rerun only when initialSearchParams prop changes

  // --- Callbacks for AirportSearchInput ---
  const handleFromAirportSelect = useCallback((airportCode: string | null, _cityCode: string | null, displayValue: string | null) => {
    setOriginAirportCode(airportCode); // Store the airport code
    setFromDisplayValue(displayValue); // Keep storing the display value for potential repopulation
  }, []);

  const handleToAirportSelect = useCallback((airportCode: string | null, _cityCode: string | null, displayValue: string | null) => {
    setDestinationAirportCode(airportCode); // Store the airport code
    setToDisplayValue(displayValue);     // Keep storing the display value
  }, []);

  // --- Handler for Trip Type Radio Buttons ---
  const handleTripTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newTripType = event.target.value as 'round-trip' | 'one-way';
      setTripType(newTripType);
      if (newTripType === 'one-way') {
          setReturnDate(''); // Clear return date for one-way trips
      }
  };

  // --- Form Submission Handler ---
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Validation
    if (!originAirportCode || !destinationAirportCode) {
      alert("Please select departure and destination locations.");
      return;
    }
    if (!departureDate) {
      alert("Please select a departure date.");
      return;
    }
    if (tripType === 'round-trip' && !returnDate) {
       alert("Please select a return date for round trips.");
       return;
    }
    if (tripType === 'round-trip' && returnDate && departureDate && returnDate < departureDate) {
      alert("Return date cannot be before the departure date.");
      return;
    }
    if (!travelers) {
        alert("Please select the number of travelers.");
        return;
    }

    // Construct searchParams object for the parent (HomePage)
    const searchParams: SearchParamsType = {
        originAirport: originAirportCode,
        destinationAirport: destinationAirportCode,
        departureDate,
        returnDate: tripType === 'round-trip' ? returnDate : undefined, // Only include if round-trip
        travelers,
        tripType,
        fromDisplayValue, // Pass display values along too
        toDisplayValue
    };
    console.log("SearchSection submitting:", searchParams);
    onSearchSubmit(searchParams); // Call the callback passed from HomePage
    setIsMinimized(true); // Minimize the form after successful submission
  };

  // --- Handler to Re-expand the Form ---
  const handleEditFilters = () => {
    setIsMinimized(false);
  };

  // --- Render Logic ---

  // Minimized View
  if (isMinimized) {
      return (
          <section id="search" className="py-4 bg-gray-50 scroll-mt-24"> {/* scroll-mt matches sticky header height */}
              <div className="container mx-auto px-4">
                  <button
                      onClick={handleEditFilters}
                      className="w-full md:w-auto md:mx-auto flex items-center justify-center px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 transition duration-200 text-blue-600 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      aria-label="Edit search filters"
                  >
                      {/* Filter Icon SVG */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-6.586L3.293 6.707A1 1 0 013 6V3zm3.707 4.707L10 11.414l3.293-3.707a1 1 0 00.293-.707V4H4v2a1 1 0 00.707.924l.001.001.001.001a.998.998 0 00.998-.001L6.707 7.707z" clipRule="evenodd" />
                      </svg>
                      Edit Filters
                  </button>
              </div>
          </section>
      );
  }

  // Expanded View (Form)
  return (
    <section id="search" className="py-12 md:py-16 bg-gray-50 scroll-mt-24"> {/* scroll-mt matches sticky header height */}
      <div className="container mx-auto px-4">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center md:text-left font-serif"> {/* Example: font-serif */}
            Find Your Next Adventure
          </h2>

          {/* Trip Type Radio Buttons */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
             <label className="flex items-center cursor-pointer">
                 <input type="radio" name="trip-type" value="round-trip" checked={tripType === 'round-trip'} onChange={handleTripTypeChange} className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                 <span className="ml-2 text-gray-700">Round Trip</span>
             </label>
             <label className="flex items-center cursor-pointer">
                 <input type="radio" name="trip-type" value="one-way" checked={tripType === 'one-way'} onChange={handleTripTypeChange} className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                 <span className="ml-2 text-gray-700">One Way</span>
             </label>
          </div>

          {/* Main Form Grid */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-start">
            {/* From Airport Input */}
            <div className="lg:col-span-1">
              <AirportSearchInput
                  id="from"
                  label="From"
                  placeholder="City or airport"
                  onAirportSelect={handleFromAirportSelect}
                  initialDisplayValue={fromDisplayValue} // Pass state for controlled input
              />
            </div>
            {/* To Airport Input */}
            <div className="lg:col-span-1">
              <AirportSearchInput
                  id="to"
                  label="To"
                  placeholder="City or airport"
                  onAirportSelect={handleToAirportSelect}
                  initialDisplayValue={toDisplayValue} // Pass state for controlled input
              />
            </div>

            {/* Date Inputs */}
            <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="w-full">
                <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-1">Depart</label>
                <input
                    type="date" id="departure-date" name="departure-date" required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out h-[42px]" // Match height
                    min={today} // Prevent selecting past dates
                />
              </div>
              <div className="w-full">
                <label htmlFor="return-date" className="block text-sm font-medium text-gray-700 mb-1">Return</label>
                <input
                    type="date" id="return-date" name="return-date"
                    required={tripType === 'round-trip'} // Only required for round trip
                    disabled={tripType === 'one-way'}    // Disable for one-way
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out h-[42px] ${tripType === 'one-way' ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`} // Style when disabled
                    min={departureDate || today} // Min return date is departure date or today
                 />
              </div>
            </div>

            {/* Travelers Input */}
            <div className="lg:col-span-1">
               <label htmlFor="travelers" className="block text-sm font-medium text-gray-700 mb-1">Travelers</label>
               <select
                   id="travelers" name="travelers" required
                   value={travelers}
                   onChange={(e) => setTravelers(e.target.value)}
                   className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white h-[42px] transition duration-150 ease-in-out appearance-none pr-8 bg-no-repeat bg-right" // Basic styling for select
                   style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>')`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
               >
                   {/* Generate options programmatically or list them */}
                   {[1, 2, 3, 4, 5, 6].map(num => ( // Example up to 6 travelers
                       <option key={num} value={num}>
                           {num} Adult{num > 1 ? 's' : ''}
                       </option>
                   ))}
                   {/* Add options for children/infants if needed */}
               </select>
            </div>

            {/* Search Button */}
            <div className="sm:col-span-2 lg:col-span-1 self-end">
               {/* Add hidden label for accessibility or keep button text clear */}
               <label htmlFor="search-button" className="block text-sm font-medium text-transparent mb-1 select-none">Search</label>
               <button
                   id="search-button"
                   type="submit"
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center h-[42px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                   {/* Search Icon Optional */}
                   {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg> */}
                   Search Flights
               </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SearchSection; // Export the component