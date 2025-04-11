// ---- IMPORTANT: Add this directive at the top ----
'use client';
// --------------------------------------------------

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// --- Font Imports ---
import { Lobster, Playfair_Display } from 'next/font/google';

// --- Instantiate Fonts ---
const lobster = Lobster({
    subsets: ['latin'],
    weight: ['400'], // Lobster typically only has 400 weight
    variable: '--font-lobster', // Optional: CSS Variable approach
    display: 'swap',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'], // Include needed weights
    variable: '--font-playfair', // Optional: CSS Variable approach
    display: 'swap',
});

// --- Helper Hook for Debouncing ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Type definitions ---
interface Airport { airport_code: string; airport_name: string; city_code: string; city_name: string;}
interface Flight { origin_airport: string; destination_airport: string; departure_at: string; return_at?: string; airline: string; price: number; link: string; }
interface FlightApiResponse { data: Flight[]; exactMatch: boolean; }
interface SearchParamsType { originCity: string; destinationCity: string; departureDate: string; returnDate?: string; travelers: string; tripType: 'round-trip' | 'one-way'; fromDisplayValue?: string | null; toDisplayValue?: string | null; } // Added display values


// --- Airport Search Input Component (Updated for New API Structure) ---
interface AirportSearchInputProps {
  id: string;
  label: string;
  placeholder: string;
  // Callback signature remains conceptually the same, but data source changes
  onAirportSelect: (
      airportCode: string | null, // The selected AIRPORT code (e.g., JFK)
      cityCode: string | null,    // The associated CITY code (e.g., NYC)
      displayValue: string | null // The formatted string for the input field
    ) => void;
  initialDisplayValue?: string | null;
}

const AirportSearchInput: React.FC<AirportSearchInputProps> = ({
  id,
  label,
  placeholder,
  onAirportSelect,
  initialDisplayValue,
}) => {
  const [query, setQuery] = useState(initialDisplayValue || '');
  const [suggestions, setSuggestions] = useState<Airport[]>([]); // Expecting new Airport structure
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

  // *** UPDATED: Helper to format display string ***
  const getFormattedDisplay = (airport: Airport | null): string => {
      if (!airport) return '';
      // Format: [airport_code] — [airport_name] ([city_name])
      return `${airport.airport_code} — ${airport.airport_name} (${airport.city_name || 'N/A'})`;
  };

  // Effect to sync with initialDisplayValue (mostly unchanged logic)
  useEffect(() => {
    if (isMounted.current) { if (initialDisplayValue !== query) { console.log(`Syncing input ${id} with initialDisplayValue:`, initialDisplayValue); setQuery(initialDisplayValue || ''); if (!initialDisplayValue) { setSelectedAirport(null); } setIsDropdownOpen(false); }
    } else { setQuery(initialDisplayValue || ''); isMounted.current = true; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDisplayValue]);

  // Fetch suggestions Effect (Updated filtering)
  useEffect(() => {
    const currentFormattedSelection = getFormattedDisplay(selectedAirport);
    if (selectedAirport && query === currentFormattedSelection) { setSuggestions([]); setIsDropdownOpen(false); return; }
    if (selectedAirport && query !== currentFormattedSelection) { console.log(`Clearing local selection for ${id} because query changed.`); setSelectedAirport(null); }
    if (debouncedQuery.length < 2 || (selectedAirport && query === currentFormattedSelection)) { setSuggestions([]); setIsDropdownOpen(false); return; }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search-airports?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) throw new Error('Network response error');
        const data: Airport[] = await response.json(); // Expecting new Airport structure
        // *** UPDATED: Filter based on new required fields ***
        const validSuggestions = data.filter(airport => airport.airport_code && airport.city_code && airport.airport_name && airport.city_name);
        setSuggestions(validSuggestions);
        setIsDropdownOpen(validSuggestions.length > 0 && query !== currentFormattedSelection);
        setActiveIndex(-1);
      } catch (error) { console.error("Failed to fetch airport suggestions:", error); setSuggestions([]); setIsDropdownOpen(false); }
       finally { setIsLoading(false); }
    };
    if (query !== currentFormattedSelection) { fetchSuggestions(); }
  }, [debouncedQuery, query, selectedAirport]);


  // Outside click handler (Unchanged)
  useEffect(() => { /* ... */ }, []);

  // handleInputChange (Updated to clear parent state correctly)
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setQuery(newValue);
      if (newValue === '') {
          console.log(`Input ${id} cleared manually, clearing parent state.`);
          setSelectedAirport(null);
          onAirportSelect(null, null, null); // Clear all codes and display value in parent
          setSuggestions([]);
          setIsDropdownOpen(false);
      }
  };

  // handleSuggestionClick (Updated to pass correct codes)
  const handleSuggestionClick = (airport: Airport) => {
    const displayValue = getFormattedDisplay(airport); // Use updated helper
    setQuery(displayValue);
    setSelectedAirport(airport);
    // Pass AIRPORT code, CITY code, and display value up
    onAirportSelect(airport.airport_code, airport.city_code, displayValue);
    setSuggestions([]);
    setIsDropdownOpen(false);
    setActiveIndex(-1);
  };

  // handleKeyDown (Unchanged logic)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => { /* ... */ };

  // listRef and scroll effect (Unchanged)
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => { /* ... */ }, [activeIndex]);

  // --- Render ---
  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="text" id={id} name={id} placeholder={placeholder} value={query} onChange={handleInputChange} onKeyDown={handleKeyDown} onFocus={() => { if (suggestions.length > 0 && query !== getFormattedDisplay(selectedAirport)) setIsDropdownOpen(true); }} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" autoComplete="off" />
      {isLoading && <div className="absolute right-2 top-[34px] h-5 w-5 animate-spin rounded-full border-2 border-t-blue-600 border-gray-200"></div>}
      {isDropdownOpen && suggestions.length > 0 && (
        <ul ref={listRef} className="absolute z-20 mt-1 max-h-72 w-[450px] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg" >
          {suggestions.map((airport, index) => (
            // *** UPDATED: Display format in dropdown ***
            <li
              key={airport.airport_code} // Use airport_code as key
              onClick={() => handleSuggestionClick(airport)}
              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${index === activeIndex ? 'bg-blue-100' : ''}`}
            >
              {/* Format: [airport_code] — [airport_name] ([city_name]) */}
              <div>
                  <span className="font-semibold text-gray-800">{airport.airport_code}</span>
                  <span className="text-gray-700"> — {airport.airport_name}</span>
                  <span className="text-sm text-gray-500"> ({airport.city_name})</span>
              </div>
               {/* Optional: Show city code for debugging */}
               {/* <div className="text-xs text-red-500 mt-1">City Code: {airport.city_code}</div> */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


// --- Header Component ---
const Header: React.FC = () => {
  const logoSize = 96; const headerHeightClass = 'h-24'; const logoHeightClass = 'h-20';
  return (
      <header className={`bg-white shadow-sm sticky top-0 z-50 ${headerHeightClass}`}>
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
              <div className={`flex justify-between items-center h-full`}>
                  <div className="flex-shrink-0 flex items-center">
                      <Link href="/" className="flex items-center space-x-3">
                          <Image src="/gojumpingjack-logo-no-text.png" alt="GoJumpingJack Logo" width={logoSize} height={logoSize} className={`${logoHeightClass} w-auto`} priority />
                          {/* Apply Lobster font class */}
                          <span className={`font-bold text-3xl text-gray-800 hidden sm:inline ${lobster.className}`}>
                              GoJumpingJack
                          </span>
                      </Link>
                  </div>
                  <div className="flex items-center space-x-4">
                      <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
                      <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-300">Sign Up</Link>
                  </div>
              </div>
          </nav>
      </header>
  );
};

// --- HeroSection Component ---
const HeroSection: React.FC = () => {
  return (
      // Reduced min-height from 60vh to 40vh, adjusted pt slightly
      <section className={`bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white min-h-[45vh] flex items-center justify-center text-center px-4 py-12 pt-20`}>
          <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-up">
                  Discover Real Travel Deals
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-8 animate-fade-in-up animation-delay-300">
                  Powered by real people. Backed by AI.
              </p>
              <Link href="#search" scroll={true} className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 inline-block animate-fade-in-up animation-delay-600">
                  Start Exploring
              </Link>
          </div>
          {/* Animation styles (Unchanged) */}
          <style jsx global>{` @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; } .animation-delay-300 { animation-delay: 0.3s; } .animation-delay-600 { animation-delay: 0.6s; } `}</style>
      </section>
  );
};

// --- SearchSection Component (Restored Elements AGAIN) ---
interface SearchSectionProps {
  onSearchSubmit: (params: SearchParamsType) => void;
  initialSearchParams?: SearchParamsType | null;
}

const SearchSection: React.FC<SearchSectionProps> = ({ onSearchSubmit, initialSearchParams }) => {
  // State variables
  const [originCityCode, setOriginCityCode] = useState<string | null>(initialSearchParams?.originCity || null);
  const [destinationCityCode, setDestinationCityCode] = useState<string | null>(initialSearchParams?.destinationCity || null);
  const [fromDisplayValue, setFromDisplayValue] = useState<string | null>(initialSearchParams?.fromDisplayValue || null);
  const [toDisplayValue, setToDisplayValue] = useState<string | null>(initialSearchParams?.toDisplayValue || null);
  const [departureDate, setDepartureDate] = useState<string>(initialSearchParams?.departureDate || '');
  const [returnDate, setReturnDate] = useState<string>(initialSearchParams?.returnDate || '');
  const [travelers, setTravelers] = useState<string>(initialSearchParams?.travelers || '1');
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>(initialSearchParams?.tripType || 'round-trip');
  const [isMinimized, setIsMinimized] = useState(false);

  // Effect for reset/prefill
   useEffect(() => {
    if (initialSearchParams === null) {
        setOriginCityCode(null); setDestinationCityCode(null); setFromDisplayValue(null); setToDisplayValue(null);
        setDepartureDate(''); setReturnDate(''); setTravelers('1'); setTripType('round-trip');
        setIsMinimized(false);
    } else if (initialSearchParams) {
        setOriginCityCode(initialSearchParams.originCity); setDestinationCityCode(initialSearchParams.destinationCity); setFromDisplayValue(initialSearchParams.fromDisplayValue || null); setToDisplayValue(initialSearchParams.toDisplayValue || null);
        setDepartureDate(initialSearchParams.departureDate); setReturnDate(initialSearchParams.returnDate || ''); setTravelers(initialSearchParams.travelers); setTripType(initialSearchParams.tripType);
    }
  }, [initialSearchParams]);

  // Callbacks
  const handleFromAirportSelect = useCallback((_airportCode: string | null, cityCode: string | null, displayValue: string | null) => { setOriginCityCode(cityCode); setFromDisplayValue(displayValue); }, []);
  const handleToAirportSelect = useCallback((_airportCode: string | null, cityCode: string | null, displayValue: string | null) => { setDestinationCityCode(cityCode); setToDisplayValue(displayValue); }, []);
  const handleTripTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => { const newTripType = event.target.value as 'round-trip' | 'one-way'; setTripType(newTripType); if (newTripType === 'one-way') { setReturnDate(''); } };

  // Submit Handler
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!originCityCode || !destinationCityCode) { alert("Please select departure and destination locations."); return; }
    if (!departureDate || (tripType === 'round-trip' && !returnDate)) { alert("Please select travel dates."); return; }
    if (tripType === 'round-trip' && returnDate < departureDate) { alert("Return date cannot be before departure date."); return; }
    const searchParams: SearchParamsType = {
        originCity: originCityCode, destinationCity: destinationCityCode, departureDate,
        returnDate: tripType === 'round-trip' ? returnDate : undefined,
        travelers, tripType, fromDisplayValue, toDisplayValue
    };
    onSearchSubmit(searchParams);
    setIsMinimized(true);
  };

  const handleEditFilters = () => { setIsMinimized(false); };

  // Minimized view rendering
  const today = new Date().toISOString().split('T')[0];
  if (isMinimized) {
      return ( <section id="search" className="py-4 bg-gray-50 scroll-mt-24"> <div className="container mx-auto px-4"> <button onClick={handleEditFilters} className="w-full md:w-auto md:mx-auto flex items-center justify-center px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 transition duration-200 text-blue-600 font-semibold"> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-6.586L3.293 6.707A1 1 0 013 6V3zm3.707 4.707L10 11.414l3.293-3.707a1 1 0 00.293-.707V4H4v2a1 1 0 00.707.924l.001.001.001.001a.998.998 0 00.998-.001L6.707 7.707z" clipRule="evenodd" /></svg> Edit Filters </button> </div> </section> );
    }

  // --- Expanded view form rendering (VERIFIED elements are present) ---
  return (
    <section id="search" className="py-12 md:py-16 bg-gray-50 scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center md:text-left">Find Your Next Adventure</h2>

          {/* === Radio Buttons === */}
          <div className="flex space-x-4 mb-6">
             <label className="flex items-center cursor-pointer">
                 <input type="radio" name="trip-type" value="round-trip" checked={tripType === 'round-trip'} onChange={handleTripTypeChange} className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"/>
                 <span className="ml-2 text-gray-700">Round Trip</span>
             </label>
             <label className="flex items-center cursor-pointer">
                 <input type="radio" name="trip-type" value="one-way" checked={tripType === 'one-way'} onChange={handleTripTypeChange} className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"/>
                 <span className="ml-2 text-gray-700">One Way</span>
             </label>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-start">
            {/* === Airport Inputs === */}
            <div className="lg:col-span-1">
              <AirportSearchInput id="from" label="From" placeholder="City or airport" onAirportSelect={handleFromAirportSelect} initialDisplayValue={fromDisplayValue} />
            </div>
            <div className="lg:col-span-1">
              <AirportSearchInput id="to" label="To" placeholder="City or airport" onAirportSelect={handleToAirportSelect} initialDisplayValue={toDisplayValue} />
            </div>

            {/* === Date Inputs === */}
            <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 gap-2">
              <div className="w-full">
                <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-1">Depart</label>
                <input type="date" id="departure-date" name="departure-date" required value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" min={today} />
              </div>
              <div className="w-full">
                <label htmlFor="return-date" className="block text-sm font-medium text-gray-700 mb-1">Return</label>
                <input type="date" id="return-date" name="return-date" required={tripType === 'round-trip'} disabled={tripType === 'one-way'} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out ${tripType === 'one-way' ? 'bg-gray-100 cursor-not-allowed' : ''}`} min={departureDate || today} />
              </div>
            </div>

            {/* === Travelers Input === */}
            <div className="lg:col-span-1">
               <label htmlFor="travelers" className="block text-sm font-medium text-gray-700 mb-1">Travelers</label>
               <select id="travelers" name="travelers" required value={travelers} onChange={(e) => setTravelers(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white h-[42px] transition duration-150 ease-in-out">
                   <option value="1">1 Adult</option>
                   <option value="2">2 Adults</option>
                   <option value="3">3 Adults</option>
                   <option value="4">4 Adults</option>
               </select>
            </div>

            {/* === Search Button === */}
            <div className="sm:col-span-2 lg:col-span-1 self-end">
               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center h-[42px]">
                   Search Flights
               </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};


// --- Flight Results Component ---
interface FlightResultsProps {
  searchParams: SearchParamsType | null; // Expects SearchParamsType with city codes
}

const FlightResults: React.FC<FlightResultsProps> = ({ searchParams }) => {
  // ... (useState, formatDate, etc. remain the same) ...
  const [flights, setFlights] = useState<Flight[]>([]);
  const [exactMatch, setExactMatch] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      if (!searchParams) { setFlights([]); setExactMatch(true); setError(null); setIsLoading(false); return; }

      const fetchFlights = async () => {
          setIsLoading(true); setError(null); setFlights([]);

          // *** UPDATED: Construct query using CITY codes ***
          const query = new URLSearchParams({
              // Use originCity and destinationCity from searchParams
              originCity: searchParams.originCity,
              destinationCity: searchParams.destinationCity,
              departureDate: searchParams.departureDate,
              adults: searchParams.travelers,
          });
          if (searchParams.tripType === 'round-trip' && searchParams.returnDate) {
              query.set('returnDate', searchParams.returnDate);
          }

          try {
              // Fetch using the correct city parameters
              const response = await fetch(`/api/flights?${query.toString()}`);
              // ... (rest of fetch logic, error handling, parsing remains the same) ...

          } catch (err: any) { /* ... error handling ... */ }
           finally { setIsLoading(false); }
      };

      fetchFlights();

  }, [searchParams]);

  // *** UPDATED formatDate function ***
  const formatDate = (dateString: string | undefined): string => {
      if (!dateString) {
          console.warn("formatDate received undefined or empty date string.");
          return 'N/A';
      }
      try {
          // Attempt to parse the date string directly
          const date = new Date(dateString);

          // Check if the resulting date object is valid
          if (isNaN(date.getTime())) {
               // Log the problematic string for debugging
               console.error(`Invalid date value encountered: "${dateString}"`);
               return 'Invalid Date'; // Return a clear error indicator
          }

          // Format the valid date (using UTC as before, adjust if needed)
          // Consider removing timeZone if you want local time based on user's browser
          return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC' // Or omit for local time
          });
      } catch (e) {
          // Catch any unexpected errors during parsing/formatting
          console.error(`Error formatting date string "${dateString}":`, e);
          return 'Invalid Date';
      }
  }
  // --- Render Logic (largely unchanged) ---

  if (isLoading) { /* ... loading indicator ... */ }
  if (error) { /* ... error message ... */ }
  if (!searchParams) { return null; }

  return (
      <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4">
              {/* "No exact match" warning */}
              {!exactMatch && flights.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-center text-yellow-800">
                      <p>⚠️ No exact matches found for your selected dates. Here are the closest available options.</p>
                  </div>
              )}

              {/* No results found message */}
              {flights.length === 0 && !isLoading && (
                  <div className="text-center text-gray-600 py-10">
                      <p className="text-xl mb-2">No flights found for your search criteria.</p>
                      <p>Try adjusting your dates or airports.</p>
                  </div>
               )}

              {/* Display Flight Cards */}
              {flights.length > 0 && (
                  <div className="space-y-4">
                      {flights.slice(0, 3).map((flight, index) => (
                          <div
                              key={flight.link || index} // Use link or index as key
                              className="flex flex-col md:flex-row items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow duration-200 gap-4"
                          >
                              {/* Flight Details Column */}
                              <div className="flex-grow flex flex-col sm:flex-row justify-between gap-4 w-full md:w-auto">
                                  {/* Origin/Destination */}
                                  <div className="flex items-center gap-2">
                                      <span className="font-bold text-lg">{flight.origin_airport}</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L10 8.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" transform="rotate(90 10 10)" />
                                      </svg>
                                      <span className="font-bold text-lg">{flight.destination_airport}</span>
                                  </div>
                                  {/* Dates - Uses the updated formatDate */}
                                  <div className="text-sm text-gray-600 text-center sm:text-left">
                                      <span>Depart: {formatDate(flight.departure_at)}</span>
                                      {flight.return_at && <span className="ml-3">Return: {formatDate(flight.return_at)}</span>}
                                  </div>
                                  {/* Airline */}
                                  <div className="text-sm text-gray-700 font-medium text-center sm:text-right">{flight.airline}</div>
                              </div>

                              {/* Price & Link Column */}
                              <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0 flex-shrink-0">
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
                              </div>
                          </div>
                      ))}

                      {/* See More Results Link */}
                      {flights.length > 3 && (
                          <div className="text-center mt-6">
                              <Link
                                  href="/results" // Points to src/app/results/page.tsx
                                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                              >
                                  See all {flights.length} results →
                              </Link>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </section>
  );
};


// --- TrendingDestinationsSection (Unchanged) ---
const TrendingDestinationsSection: React.FC = () => { const destinations = [ { id: 1, name: 'Tokyo, Japan', image: '/placeholder-tokyo.jpg', description: 'Vibrant culture meets futuristic skyline.' }, { id: 2, name: 'Paris, France', image: '/placeholder-paris.jpg', description: 'The city of love, lights, and art.' }, { id: 3, name: 'Maui, Hawaii', image: '/placeholder-maui.jpg', description: 'Sun-kissed beaches and volcanic landscapes.' }, { id: 4, name: 'Rome, Italy', image: '/placeholder-rome.jpg', description: 'Ancient history and delicious pasta.' }, ]; return ( <section id="trending" className="py-12 md:py-16 bg-gray-100"> <div className="container mx-auto px-4"> <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">Trending Destinations</h2> <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"> {destinations.map((dest) => ( <div key={dest.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group"> <div className="w-full h-48 bg-gray-300 flex items-center justify-center text-gray-500 relative overflow-hidden"><span className="z-10">Image ({dest.name})</span></div> <div className="p-4 md:p-6"> <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 truncate">{dest.name}</h3> <p className="text-gray-600 text-sm mb-3 h-10 overflow-hidden">{dest.description}</p> <Link href={`/destination/${dest.id}`} className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium group-hover:translate-x-1 transition-transform duration-200">Explore →</Link> </div> </div> ))} </div> </div> </section> ); };

// --- HowItWorksSection (Unchanged) ---
const HowItWorksSection: React.FC = () => { const steps = [ { id: 1, title: 'Search & Filter', description: 'Find deals filtering by price, dates, user ratings & more.', icon: '1' }, { id: 2, title: 'Discover Insights', description: 'See real reviews, AI tips & gamified destination challenges.', icon: '2' }, { id: 3, title: 'Book & Earn!', description: 'Securely book flights/hotels via partners & earn points!', icon: '3' }, ]; return ( <section id="how-it-works" className="py-12 md:py-16 bg-gray-50"> <div className="container mx-auto px-4"> <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">How GoJumpingJack Works</h2> <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto"> {steps.map((step) => ( <div key={step.id} className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300"> <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center ring-4 ring-blue-50"><span className="text-blue-600 text-xl font-bold">{step.icon}</span></div> <h3 className="text-lg font-semibold text-gray-800 mb-2">{step.title}</h3> <p className="text-gray-600 text-sm">{step.description}</p> </div> ))} </div> </div> </section> ); };

// --- Footer Component (Unchanged) ---
const Footer: React.FC = () => {
  const footerLogoSize = 48; const footerLogoHeightClass = 'h-10';
  return (
      <footer className="bg-gray-800 text-gray-400 py-8">
          <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0 text-center md:text-left">
                      <Link href="/" className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                          <Image src="/gojumpingjack-logo-no-text.png" alt="GoJumpingJack Logo Footer" width={footerLogoSize} height={footerLogoSize} className={`${footerLogoHeightClass} w-auto`} />
                          {/* Apply Lobster font class */}
                          <span className={`text-xl font-semibold text-gray-200 ${lobster.className}`}>
                              GoJumpingJack
                          </span>
                      </Link>
                      <p className="text-sm">© {new Date().getFullYear()} GoJumpingJack. All rights reserved.</p>
                  </div>
                  <nav className="flex space-x-6">
                      <Link href="/about" className="text-sm hover:text-white transition-colors duration-200">About</Link>
                      <Link href="/contact" className="text-sm hover:text-white transition-colors duration-200">Contact</Link>
                      <Link href="/terms" className="text-sm hover:text-white transition-colors duration-200">Terms</Link>
                  </nav>
              </div>
          </div>
      </footer>
  );
};


// --- Main Page Component (MODIFIED for Scroll to Top) ---
export default function HomePage() {
  const [searchParams, setSearchParams] = useState<SearchParamsType | null>(null);

  const handleSearchSubmit = (params: SearchParamsType) => {
      console.log("HomePage received search params:", params);
      setSearchParams(params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
      // Apply Playfair font class to the outermost div
      // ** BEST PRACTICE:** Apply this in src/app/layout.tsx to the <body> tag
      <div className={`flex flex-col min-h-screen bg-gray-50 ${playfair.className}`}>
          <Header />
          <main className="flex-grow">
              <HeroSection />
              <SearchSection
                   onSearchSubmit={handleSearchSubmit}
                   initialSearchParams={searchParams}
               />
              <FlightResults searchParams={searchParams} />
              <TrendingDestinationsSection />
              <HowItWorksSection />
          </main>
          <Footer />
      </div>
  );
}

