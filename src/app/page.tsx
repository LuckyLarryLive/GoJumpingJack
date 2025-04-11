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
interface SearchParamsType { originAirport: string; destinationAirport: string; departureDate: string; returnDate?: string; travelers: string; tripType: 'round-trip' | 'one-way'; fromDisplayValue?: string | null; toDisplayValue?: string | null; } // Added display values


// --- Airport Search Input Component (Updated for New API & Focus Behavior) ---
interface AirportSearchInputProps {
  id: string;
  label: string;
  placeholder: string;
  onAirportSelect: (
    airportCode: string | null,
    cityCode: string | null,
    displayValue: string | null
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
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const isMounted = useRef(false);
  // Flag to track if the user is currently interacting (typing/selecting)
  const isInteracting = useRef(false);

  // Helper to format display string
  const getFormattedDisplay = (airport: Airport | null): string => {
    if (!airport) return '';
    return `${airport.airport_code} — ${airport.airport_name} (${airport.city_name || 'N/A'})`;
  };

  // Effect to sync with initialDisplayValue from parent (e.g., on edit/reset)
  useEffect(() => {
    // Only sync if not actively interacting and value differs or is reset
    if (!isInteracting.current) {
       if (initialDisplayValue !== query) {
            console.log(`Syncing input ${id} with initialDisplayValue:`, initialDisplayValue);
            const newQuery = initialDisplayValue || '';
            setQuery(newQuery);
            // If syncing to an empty value, clear local selection
            if (!initialDisplayValue) {
                setSelectedAirport(null);
            } else {
                // Attempt to find matching airport if display value is provided (e.g., re-editing)
                // Note: This requires an initial suggestion list or separate lookup if not available
                // For simplicity, we currently rely on the user re-selecting if editing.
                // We reset local selection if the display value doesn't match a known format.
                // A more robust solution might involve looking up the airport from the display value.
                 if (!selectedAirport || getFormattedDisplay(selectedAirport) !== initialDisplayValue) {
                    setSelectedAirport(null); // Reset local if display value doesn't match current local selection
                 }
            }
            setIsDropdownOpen(false);
       }
    }
    // Reset interaction flag after sync attempt
    isInteracting.current = false;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDisplayValue]); // Rerun only when the initial prop changes


  // Fetch suggestions Effect
  useEffect(() => {
    const currentFormattedSelection = getFormattedDisplay(selectedAirport);

    // Don't fetch if the query is exactly what's selected
    if (selectedAirport && query === currentFormattedSelection) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    // If query changes *away* from a selected value, clear the selection
    if (selectedAirport && query !== currentFormattedSelection) {
      console.log(`Clearing local selection for ${id} because query changed from formatted value.`);
      setSelectedAirport(null);
      // Don't call onAirportSelect here yet, wait for user to finish typing or clear
    }

    // Standard debounce and minimum length check
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search-airports?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) throw new Error('Network response error');
        const data: Airport[] = await response.json();
        const validSuggestions = data.filter(airport => airport.airport_code && airport.city_code && airport.airport_name && airport.city_name);

        // Only update suggestions if the query hasn't changed again rapidly
        // And only show dropdown if there are suggestions and query isn't empty/selected
         if (query === debouncedQuery) { // Ensure this fetch corresponds to the *current* query
            setSuggestions(validSuggestions);
            // Only open dropdown if results exist and we don't have an exact match selected
            setIsDropdownOpen(validSuggestions.length > 0 && query !== currentFormattedSelection && query.length > 0);
            setActiveIndex(-1);
         }
      } catch (error) {
        console.error("Failed to fetch airport suggestions:", error);
        setSuggestions([]);
        setIsDropdownOpen(false);
      } finally {
        // Only set loading false if this fetch corresponds to the *current* query
        if (query === debouncedQuery) {
             setIsLoading(false);
        }
      }
    };

    // Only fetch if the query isn't blank and isn't the currently selected formatted value
    if (query !== '' && query !== currentFormattedSelection) {
      fetchSuggestions();
    } else {
        setSuggestions([]); // Clear suggestions if query is blank or matches selection
        setIsDropdownOpen(false);
    }
  }, [debouncedQuery, query, selectedAirport]); // Dependencies


  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Handle Input Change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    isInteracting.current = true; // User is typing
    const newValue = event.target.value;
    setQuery(newValue);

    // If user clears the input manually, ensure parent state is cleared
    if (newValue === '') {
      console.log(`Input ${id} cleared manually, clearing parent state.`);
      setSelectedAirport(null); // Clear local selection
      onAirportSelect(null, null, null); // Clear parent state
      setSuggestions([]);
      setIsDropdownOpen(false);
    } else if (selectedAirport) {
      // If user starts typing *over* a selected value, clear the selection state
      setSelectedAirport(null);
      // Don't clear parent state yet, wait for potential new selection or manual clear
      console.log(`Input ${id} changed from selected value, clearing local selection.`);
    }
  };

  // Handle Suggestion Click
  const handleSuggestionClick = (airport: Airport) => {
    isInteracting.current = true; // User is selecting
    const displayValue = getFormattedDisplay(airport);
    setQuery(displayValue);
    setSelectedAirport(airport);
    onAirportSelect(airport.airport_code, airport.city_code, displayValue); // Update parent
    setSuggestions([]);
    setIsDropdownOpen(false);
    setActiveIndex(-1);
    // Set interacting false slightly later to allow state updates
    setTimeout(() => { isInteracting.current = false; }, 100);
  };

   // *** NEW: Handle Focus ***
   const handleFocus = () => {
        isInteracting.current = true; // User focused
        const currentFormattedSelection = getFormattedDisplay(selectedAirport);

        // *** If a valid airport is selected AND the input field exactly matches its display value ***
        if (selectedAirport && query === currentFormattedSelection) {
            console.log(`Clearing input ${id} on focus because a valid selection existed.`);
            setQuery('');               // Clear the visual input
            setSelectedAirport(null);   // Clear the internal selected state
            onAirportSelect(null, null, null); // **Crucially, clear the parent state**
            setSuggestions([]);         // Ensure suggestions are cleared
            setIsDropdownOpen(false);   // Ensure dropdown is closed
            setActiveIndex(-1);         // Reset keyboard nav index
            // The useEffect for debouncedQuery will trigger a fetch if query remains '' (length < 2) it won't fetch.
        }
        // Standard behavior: reopen dropdown if there are suggestions relevant to current (potentially partial) query
        else if (suggestions.length > 0 && query !== currentFormattedSelection && query.length > 0) {
             setIsDropdownOpen(true);
        }
        // Set interacting false slightly later
        setTimeout(() => { isInteracting.current = false; }, 100);
    };


  // Handle Keyboard Navigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    isInteracting.current = true; // User is using keyboard
    if (!isDropdownOpen || suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((prevIndex) => (prevIndex + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((prevIndex) => (prevIndex - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
         event.preventDefault();
         if (activeIndex >= 0 && activeIndex < suggestions.length) {
           handleSuggestionClick(suggestions[activeIndex]);
         } else if (suggestions.length === 1) {
           // If only one suggestion, Enter selects it even without arrow keys
           handleSuggestionClick(suggestions[0]);
         }
         // Maybe close dropdown if Enter pressed but no suggestion selected? Optional.
         // else { setIsDropdownOpen(false); }
         break;
      case 'Escape':
        setIsDropdownOpen(false);
        setActiveIndex(-1);
        break;
    }
    // Set interacting false slightly later
    setTimeout(() => { isInteracting.current = false; }, 100);
  };


  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const activeItem = listRef.current.children[activeIndex] as HTMLLIElement;
    if (activeItem) {
        // Simple scroll into view, could be refined for smoother scrolling if needed
        activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);


  // --- Render ---
  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
          type="text"
          id={id}
          name={id}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus} // Use the new focus handler
          // Refined onBlur to prevent closing dropdown when clicking scrollbar/item
          onBlur={() => setTimeout(() => {
              if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
                  setIsDropdownOpen(false);
              }
           }, 150)} // Delay allows click event on suggestion to fire first
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
          autoComplete="off"
       />
      {isLoading && <div className="absolute right-2 top-[34px] h-5 w-5 animate-spin rounded-full border-2 border-t-blue-600 border-gray-200"></div>}
      {/* Ensure dropdown only shows when explicitly opened */}
      {isDropdownOpen && suggestions.length > 0 && (
        <ul
            ref={listRef}
            className="absolute z-20 mt-1 max-h-72 w-full min-w-[300px] sm:w-[400px] md:w-[450px] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg" // Adjusted width potentially
        >
          {suggestions.map((airport, index) => (
            <li
              key={airport.airport_code}
              // Use onMouseDown instead of onClick to potentially register before onBlur closes dropdown
              onMouseDown={() => handleSuggestionClick(airport)}
              onMouseEnter={() => setActiveIndex(index)} // Highlight on hover
              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${index === activeIndex ? 'bg-blue-100' : ''}`}
            >
              <div>
                <span className="font-semibold text-gray-800">{airport.airport_code}</span>
                <span className="text-gray-700"> — {airport.airport_name}</span>
                <span className="text-sm text-gray-500"> ({airport.city_name})</span>
              </div>
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

// --- SearchSection Component ---
interface SearchSectionProps {
  onSearchSubmit: (params: SearchParamsType) => void;
  initialSearchParams?: SearchParamsType | null;
}

const SearchSection: React.FC<SearchSectionProps> = ({ onSearchSubmit, initialSearchParams }) => {
  // --- State variables ---
  // CHANGED: Store airport codes instead of city codes
  const [originAirportCode, setOriginAirportCode] = useState<string | null>(initialSearchParams?.originAirport || null);
  const [destinationAirportCode, setDestinationAirportCode] = useState<string | null>(initialSearchParams?.destinationAirport || null);

  // Keep display values and other states the same
  const [fromDisplayValue, setFromDisplayValue] = useState<string | null>(initialSearchParams?.fromDisplayValue || null);
  const [toDisplayValue, setToDisplayValue] = useState<string | null>(initialSearchParams?.toDisplayValue || null);
  const [departureDate, setDepartureDate] = useState<string>(initialSearchParams?.departureDate || '');
  const [returnDate, setReturnDate] = useState<string>(initialSearchParams?.returnDate || '');
  const [travelers, setTravelers] = useState<string>(initialSearchParams?.travelers || '1');
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>(initialSearchParams?.tripType || 'round-trip');
  const [isMinimized, setIsMinimized] = useState(false);

  // --- Effect for reset/prefill ---
   useEffect(() => {
    if (initialSearchParams === null) {
        // Reset using airport codes
        setOriginAirportCode(null);
        setDestinationAirportCode(null);
        setFromDisplayValue(null);
        setToDisplayValue(null);
        setDepartureDate(''); setReturnDate(''); setTravelers('1'); setTripType('round-trip');
        setIsMinimized(false);
    } else if (initialSearchParams) {
        // Prefill using airport codes
        setOriginAirportCode(initialSearchParams.originAirport);
        setDestinationAirportCode(initialSearchParams.destinationAirport);
        setFromDisplayValue(initialSearchParams.fromDisplayValue || null);
        setToDisplayValue(initialSearchParams.toDisplayValue || null);
        setDepartureDate(initialSearchParams.departureDate);
        setReturnDate(initialSearchParams.returnDate || '');
        setTravelers(initialSearchParams.travelers);
        setTripType(initialSearchParams.tripType);
    }
  }, [initialSearchParams]);

  // --- Callbacks ---
  // CHANGED: Use the first argument (airportCode) from onAirportSelect
  const handleFromAirportSelect = useCallback((airportCode: string | null, _cityCode: string | null, displayValue: string | null) => {
    setOriginAirportCode(airportCode); // Store the airport code
    setFromDisplayValue(displayValue); // Keep storing the display value
  }, []);

  const handleToAirportSelect = useCallback((airportCode: string | null, _cityCode: string | null, displayValue: string | null) => {
    setDestinationAirportCode(airportCode); // Store the airport code
    setToDisplayValue(displayValue);     // Keep storing the display value
  }, []);

  const handleTripTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newTripType = event.target.value as 'round-trip' | 'one-way';
      setTripType(newTripType);
      if (newTripType === 'one-way') { setReturnDate(''); }
  };

  // --- Submit Handler ---
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // CHANGED: Validate using airport codes
    if (!originAirportCode || !destinationAirportCode) {
      alert("Please select departure and destination locations.");
      return;
    }
    if (!departureDate || (tripType === 'round-trip' && !returnDate)) {
      alert("Please select travel dates.");
      return;
    }
    if (tripType === 'round-trip' && returnDate && returnDate < departureDate) {
      alert("Return date cannot be before departure date.");
      return;
    }

    // --- Construct searchParams using AIRPORT codes ---
    const searchParams: SearchParamsType = {
        originAirport: originAirportCode, // Use the stored airport code
        destinationAirport: destinationAirportCode, // Use the stored airport code
        departureDate,
        returnDate: tripType === 'round-trip' ? returnDate : undefined,
        travelers,
        tripType,
        fromDisplayValue, // Pass display values along for state management/potential UI repopulation
        toDisplayValue
    };
    console.log("Submitting search with Airport Codes:", searchParams); // Add log for verification
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
  searchParams: SearchParamsType | null; // Expects SearchParamsType with AIRPORT codes now
}

const FlightResults: React.FC<FlightResultsProps> = ({ searchParams }) => {
  // ... state variables (flights, isLoading, error) remain the same ...
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      if (!searchParams) {
          setFlights([]);
          setError(null);
          setIsLoading(false);
          return;
      }

      const fetchFlights = async () => {
          setIsLoading(true);
          setError(null);
          setFlights([]);

          // *** UPDATED: Construct query using AIRPORT codes ***
          const query = new URLSearchParams({
              // Use originAirport and destinationAirport from searchParams
              originAirport: searchParams.originAirport,         // Use the airport code
              destinationAirport: searchParams.destinationAirport, // Use the airport code
              departureDate: searchParams.departureDate,
              // Assuming 'adults' is still the correct parameter name for travelers in your API
              // If not, update this key as well.
              adults: searchParams.travelers,
          });

          // Add returnDate if it's a round trip
          if (searchParams.tripType === 'round-trip' && searchParams.returnDate) {
              query.set('returnDate', searchParams.returnDate);
          }

          console.log(`Fetching flights with query: /api/flights?${query.toString()}`); // Log the exact query

          try {
              // Fetch using the correct airport parameters
              const response = await fetch(`/api/flights?${query.toString()}`);

               // --- Keep the robust error handling and JSON parsing from previous step ---
               if (!response.ok) {
                   const errorText = await response.text();
                   console.error("API Error Response Text:", errorText);
                   throw new Error(`API Error: ${response.status} - ${response.statusText}`);
               }
               const contentType = response.headers.get("content-type");
               if (!contentType || !contentType.includes("application/json")) {
                  const responseText = await response.text();
                  console.error("Received non-JSON response:", responseText);
                  throw new Error(`Expected JSON response, but got ${contentType}`);
               }
               const apiResponse = await response.json();
               console.log('Raw Flight API Response:', apiResponse);

               if (apiResponse && Array.isArray(apiResponse.data)) {
                   const validFlights = apiResponse.data.filter((f: any) =>
                       f && typeof f.origin_airport === 'string' && typeof f.destination_airport === 'string'
                       // Add other essential field checks if needed
                   );
                   setFlights(validFlights);
                   console.log(`Successfully set ${validFlights.length} flights.`);
               } else {
                   console.error("API response is missing 'data' array.", apiResponse);
                   setFlights([]);
               }
               setError(null);

          } catch (err: any) {
              console.error("Failed to fetch or process flights:", err);
              setError(err.message || 'Failed to fetch flight data.');
              setFlights([]);
          } finally {
              setIsLoading(false);
              console.log("Finished flight fetch attempt.");
          }
      };

      fetchFlights();

  // The dependency is still searchParams, as it now contains the airport codes
  }, [searchParams]);

  // --- Date Formatting (check console for errors here too) ---
  const formatDate = (dateString: string | undefined): string => {
      // ... (keep your existing robust formatDate function) ...
      // Add a log inside the catch block if you haven't already
       if (!dateString) return 'N/A';
       try {
           const date = new Date(dateString); // The API format 'YYYY-MM-DDTHH:mm:ss-HH:mm' IS standard ISO 8601 and should parse correctly.
           if (isNaN(date.getTime())) {
               console.error(`Invalid date value encountered in formatDate: "${dateString}"`);
               return 'Invalid Date';
           }
           // Consider removing timeZone: 'UTC' if you want dates displayed in the user's local time relative to the offset provided (-04:00)
           return date.toLocaleDateString('en-US', {
               month: 'short',
               day: 'numeric',
               // timeZone: 'UTC' // Removing this might give more expected results depending on need
           });
       } catch (e) {
           console.error(`Error formatting date string "${dateString}":`, e);
           return 'Invalid Date';
       }
   }

  // --- Render Logic ---

  // Remove or adjust the "exactMatch" warning logic
  if (isLoading) { /* ... loading ... */ }
  if (error) { /* ... error ... */ }
  if (!searchParams) { return null; } // No search performed yet

  // If not loading, no error, and flights array is empty AFTER a search
  if (!isLoading && !error && flights.length === 0 && searchParams) {
      return (
          <section className="py-8 md:py-12 bg-white">
              <div className="container mx-auto px-4">
                  <div className="text-center text-gray-600 py-10">
                      <p className="text-xl mb-2">No flights found for your search criteria.</p>
                      <p>Try adjusting your dates or airports.</p>
                  </div>
              </div>
          </section>
      );
  }

  // Render flight cards if flights array has items
  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Removed the !exactMatch warning block as API doesn't provide it */}
        {/* You could add a different type of info message if needed */}

        {flights.length > 0 && (
          <div className="space-y-4">
            {/* Display Flight Cards */}
            {flights.slice(0, 3).map((flight, index) => (
              // Key should be unique, link might not be unique enough if params change slightly?
              // Consider combining link + index or a unique ID from API if available
              <div
                key={`${flight.link || 'flight'}-${index}`}
                className="flex flex-col md:flex-row items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow duration-200 gap-4"
              >
                {/* Flight Details Column */}
                <div className="flex-grow flex flex-col sm:flex-row justify-between gap-4 w-full md:w-auto">
                  {/* Origin/Destination */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{flight.origin_airport}</span>
                    {/* Simple arrow icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                    <span className="font-bold text-lg">{flight.destination_airport}</span>
                  </div>
                  {/* Dates */}
                  <div className="text-sm text-gray-600 text-center sm:text-left">
                    <span>Depart: {formatDate(flight.departure_at)}</span>
                    {/* This condition correctly handles missing return_at */}
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
                   {/* Ensure flight.link is a valid URL or path */}
                   <a
                       href={flight.link} // Assuming this is a relative path for your site or needs prefixing
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
                   {/* Make sure this routing works as expected */}
                   <Link
                       href="/results" // Should contain logic to display all flights based on searchParams
                       className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                       // You might need to pass searchParams to the results page via state or query params
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

