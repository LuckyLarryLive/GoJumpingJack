'use client'; // Essential for components using hooks like useState, useEffect

import React, { useState, useEffect, useCallback } from 'react';
import type { SearchParamsType } from '@/types'; // Import shared type
import AirportSearchInput from './AirportSearchInput'; // Import sibling component

// Add these constants at the top of the file, after imports
const DUFFEL_CONSTRAINTS = {
  maxPassengers: 9,
  maxInfantsPerAdult: 1,
  maxBookingWindow: 365, // days
  minBookingWindow: 0, // days
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  cabinClasses: [
    { value: 'economy', label: 'Economy' },
    { value: 'premium_economy', label: 'Premium Economy' },
    { value: 'business', label: 'Business' },
    { value: 'first', label: 'First' }
  ],
  maxConnections: 2,
  minConnectionTime: 30, // minutes
  maxConnectionTime: 24 * 60, // minutes
  maxOffersPerRequest: 200
};

// --- Component Props Interface ---
// (Part of the code you cut and pasted)
interface SearchSectionProps {
  onSearchSubmit: (params: SearchParamsType) => void;
  initialSearchParams: SearchParamsType | null;
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

  // New state variables for enhanced search
  const [passengers, setPassengers] = useState({
    adults: 1,
    children: 0,
    infants: 0
  });
  const [cabinClass, setCabinClass] = useState<string>('economy');
  const [currency, setCurrency] = useState<string>('USD');
  const [maxConnections, setMaxConnections] = useState<number>(2);

  // Calculate today's date for min attribute on date inputs
  const today = new Date().toISOString().split('T')[0];

  // --- Effect for resetting or pre-filling the form based on initialSearchParams ---
  useEffect(() => {
    console.log("SearchSection initialSearchParams changed:", initialSearchParams); // Log changes
    if (initialSearchParams === null) {
        // Reset form
        console.log("SearchSection: Resetting form.");
        setOriginAirportCode(null);
        setDestinationAirportCode(null);
        setFromDisplayValue(null);
        setToDisplayValue(null);
        setDepartureDate('');
        setReturnDate('');
        setTravelers('1');
        setTripType('round-trip');
        setIsMinimized(false);
        setPassengers({ adults: 1, children: 0, infants: 0 });
        setCabinClass('economy');
        setCurrency('USD');
        setMaxConnections(2);
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
        setIsMinimized(true); // Example: Minimize when pre-filled from results page link
        setPassengers({
          adults: initialSearchParams.passengers?.adults || 1,
          children: initialSearchParams.passengers?.children || 0,
          infants: initialSearchParams.passengers?.infants || 0
        });
        setCabinClass(initialSearchParams.cabinClass || 'economy');
        setCurrency(initialSearchParams.currency || 'USD');
        setMaxConnections(initialSearchParams.maxConnections || 2);
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

    // Date validation
    const today = new Date();
    const departure = new Date(departureDate);
    const returnDateObj = returnDate ? new Date(returnDate) : null;
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + DUFFEL_CONSTRAINTS.maxBookingWindow);

    if (departure < today) {
      alert("Departure date cannot be in the past.");
      return;
    }
    if (departure > maxDate) {
      alert(`Departure date cannot be more than ${DUFFEL_CONSTRAINTS.maxBookingWindow} days in the future.`);
      return;
    }
    if (returnDateObj && returnDateObj < departure) {
      alert("Return date cannot be before the departure date.");
      return;
    }
    if (returnDateObj && returnDateObj > maxDate) {
      alert(`Return date cannot be more than ${DUFFEL_CONSTRAINTS.maxBookingWindow} days in the future.`);
      return;
    }

    // Passenger validation
    if (passengers.adults === 0) {
      alert("At least one adult passenger is required.");
      return;
    }
    if (passengers.infants > passengers.adults * DUFFEL_CONSTRAINTS.maxInfantsPerAdult) {
      alert(`Maximum ${DUFFEL_CONSTRAINTS.maxInfantsPerAdult} infant(s) per adult allowed.`);
      return;
    }
    if (passengers.adults + passengers.children + passengers.infants > DUFFEL_CONSTRAINTS.maxPassengers) {
      alert(`Maximum ${DUFFEL_CONSTRAINTS.maxPassengers} passengers allowed.`);
      return;
    }

    // Construct searchParams object for the parent (HomePage)
    const searchParams: SearchParamsType = {
        originAirport: originAirportCode,
        destinationAirport: destinationAirportCode,
        departureDate,
        returnDate: tripType === 'round-trip' ? returnDate : undefined,
        travelers,
        tripType,
        fromDisplayValue,
        toDisplayValue,
        cabinClass,
        currency,
        maxConnections,
        passengers: {
          adults: passengers.adults,
          children: passengers.children,
          infants: passengers.infants
        }
    };
    console.log("SearchSection submitting:", searchParams);
    onSearchSubmit(searchParams);
    setIsMinimized(true);
  };

  // --- Handler to Re-expand the Form ---
  const handleEditFilters = () => {
    setIsMinimized(false);
  };

  // --- Passenger Count Handlers ---
  const handlePassengerChange = (type: 'adults' | 'children' | 'infants', value: number) => {
    setPassengers(prev => {
      const newPassengers = { ...prev, [type]: value };
      // Ensure total doesn't exceed 9
      const total = newPassengers.adults + newPassengers.children + newPassengers.infants;
      if (total > 9) return prev;
      // Ensure infants don't exceed adults
      if (newPassengers.infants > newPassengers.adults) return prev;
      return newPassengers;
    });
  };

  // --- Render Logic ---

  // Minimized View
  if (isMinimized) {
      return (
          <section id="search" className="py-6 bg-gray-50">
              <div className="container mx-auto px-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm max-w-6xl mx-auto">
                      <div className="flex items-center justify-between">
                          <div className="flex-1">
                              <div className="flex items-center gap-4">
                                  <div>
                                      <span className="text-sm text-gray-500">From</span>
                                      <p className="font-medium">{fromDisplayValue || originAirportCode}</p>
                                  </div>
                                  <div>
                                      <span className="text-sm text-gray-500">To</span>
                                      <p className="font-medium">{toDisplayValue || destinationAirportCode}</p>
                                  </div>
                                  <div>
                                      <span className="text-sm text-gray-500">Dates</span>
                                      <p className="font-medium">
                                          {departureDate} {returnDate ? `- ${returnDate}` : '(One-way)'}
                                      </p>
                                  </div>
                                  <div>
                                      <span className="text-sm text-gray-500">Passengers</span>
                                      <p className="font-medium">
                                          {passengers.adults + passengers.children} {passengers.infants > 0 ? `+ ${passengers.infants} infant` : ''}
                                      </p>
                                  </div>
                                  <div>
                                      <span className="text-sm text-gray-500">Class</span>
                                      <p className="font-medium capitalize">{cabinClass.replace('_', ' ')}</p>
                                  </div>
                              </div>
                          </div>
                          <button
                              onClick={handleEditFilters}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                              Edit Search
                          </button>
                      </div>
                  </div>
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-1">Depart</label>
                <input
                    type="date" id="departure-date" name="departure-date" required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min={today} // Prevent selecting past dates
                />
              </div>
              <div>
                <label htmlFor="return-date" className="block text-sm font-medium text-gray-700 mb-1">Return</label>
                <input
                    type="date" id="return-date" name="return-date"
                    required={tripType === 'round-trip'} // Only required for round trip
                    disabled={tripType === 'one-way'}    // Disable for one-way
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${tripType === 'one-way' ? 'bg-gray-100 cursor-not-allowed' : ''}`} // Style when disabled
                    min={departureDate || today} // Min return date is departure date or today
                 />
              </div>
            </div>

            {/* Passengers */}
            <div className="lg:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">
                   Passengers
               </label>
               <div className="grid grid-cols-3 gap-2">
                   <div>
                       <label className="block text-xs text-gray-500">Adults</label>
                       <select
                           value={passengers.adults}
                           onChange={(e) => handlePassengerChange('adults', parseInt(e.target.value))}
                           className="w-full p-2 border border-gray-300 rounded-md"
                       >
                           {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                               <option key={num} value={num}>
                                   {num}
                               </option>
                           ))}
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs text-gray-500">Children</label>
                       <select
                           value={passengers.children}
                           onChange={(e) => handlePassengerChange('children', parseInt(e.target.value))}
                           className="w-full p-2 border border-gray-300 rounded-md"
                       >
                           {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                               <option key={num} value={num}>
                                   {num}
                               </option>
                           ))}
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs text-gray-500">Infants</label>
                       <select
                           value={passengers.infants}
                           onChange={(e) => handlePassengerChange('infants', parseInt(e.target.value))}
                           className="w-full p-2 border border-gray-300 rounded-md"
                       >
                           {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                               <option key={num} value={num}>
                                   {num}
                               </option>
                           ))}
                       </select>
                   </div>
               </div>
            </div>

            {/* Cabin Class */}
            <div className="lg:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">
                   Cabin Class
               </label>
               <select
                   value={cabinClass}
                   onChange={(e) => setCabinClass(e.target.value)}
                   className="w-full p-2 border border-gray-300 rounded-md"
               >
                   {DUFFEL_CONSTRAINTS.cabinClasses.map((cabin) => (
                       <option key={cabin.value} value={cabin.value}>
                           {cabin.label}
                       </option>
                   ))}
               </select>
            </div>

            {/* Currency */}
            <div className="lg:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">
                   Currency
               </label>
               <select
                   value={currency}
                   onChange={(e) => setCurrency(e.target.value)}
                   className="w-full p-2 border border-gray-300 rounded-md"
               >
                   {DUFFEL_CONSTRAINTS.supportedCurrencies.map((curr) => (
                       <option key={curr} value={curr}>
                           {curr} ({curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr === 'CAD' ? 'C$' : 'A$'})
                       </option>
                   ))}
               </select>
            </div>

            {/* Max Connections */}
            <div className="lg:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">
                   Max Connections
               </label>
               <select
                   value={maxConnections}
                   onChange={(e) => setMaxConnections(parseInt(e.target.value))}
                   className="w-full p-2 border border-gray-300 rounded-md"
               >
                   <option value="0">Non-stop only</option>
                   {Array.from({ length: DUFFEL_CONSTRAINTS.maxConnections }, (_, i) => (
                       <option key={i + 1} value={i + 1}>
                           Max {i + 1} {i === 0 ? 'connection' : 'connections'}
                       </option>
                   ))}
               </select>
            </div>

            {/* Search Button */}
            <div className="lg:col-span-4">
               <button
                   type="submit"
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300"
                >
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