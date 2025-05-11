'use client'; // Essential for components using hooks like useState, useEffect

import React, { useState, useEffect, useRef, useCallback } from 'react';
import useDebounce from '@/hooks/useDebounce'; // Import the extracted hook
import type { Airport } from '@/types'; // Import the Airport type
import { FaPlane, FaCity } from 'react-icons/fa';

// --- Component Props Interface ---
// (This was part of the code you cut and pasted)
interface AirportSearchInputProps {
  id: string;
  label: string;
  placeholder: string;
  onAirportSelect: (
    airportCode: string | null,
    cityCode: string | null, // Keep cityCode if needed by onAirportSelect signature, even if not used later
    displayValue: string | null
  ) => void;
  initialDisplayValue?: string | null;
}

// --- Airport Search Input Component ---
// (This is the main component code you cut and pasted)
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
  const debouncedQuery = useDebounce(query, 300); // Use the imported hook
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const isInteracting = useRef(false);

  // --- Helper functions, Effects, Handlers ---
  // (All the functions and useEffects from the original component go here)

  // Helper to format display string
  const getFormattedDisplay = useCallback((airport: Airport | null): string => {
    if (!airport) return '';
    // Using city_name as per your type def
    return `${airport.airport_code} — ${airport.airport_name} (${airport.city_name || 'N/A'})`;
  }, []);

  // Effect to sync with initialDisplayValue from parent
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
                // Reset local if display value doesn't match current local selection format
                 if (!selectedAirport || getFormattedDisplay(selectedAirport) !== initialDisplayValue) {
                    setSelectedAirport(null);
                 }
            }
            setIsDropdownOpen(false);
       }
    }
    // Reset interaction flag after sync attempt
    isInteracting.current = false;

  }, [initialDisplayValue, query, selectedAirport, getFormattedDisplay]); // Added dependencies


  // Fetch suggestions Effect
  useEffect(() => {
    const currentFormattedSelection = getFormattedDisplay(selectedAirport);

    if (selectedAirport && query === currentFormattedSelection) {
      setSuggestions([]); setIsDropdownOpen(false); return;
    }
    // Clear local selection if query changes away from it
    if (selectedAirport && query !== currentFormattedSelection) {
      console.log(`Clearing local selection for ${id} because query changed from formatted value.`);
      setSelectedAirport(null);
    }
    if (debouncedQuery.length < 2) {
      setSuggestions([]); setIsDropdownOpen(false); return;
    }

    const fetchSuggestions = async () => {
      if (query === currentFormattedSelection && selectedAirport) {
          return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search-airports?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) throw new Error(`Network response error: ${response.statusText}`);
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error(`Expected JSON response, got ${contentType}`);
        }
        const data: Airport[] = await response.json();
        const validSuggestions = data.filter(airport =>
            airport.airport_code && airport.city_code && airport.airport_name && airport.city_name
        );

        // --- GROUPING LOGIC START ---
        const grouped: { [city: string]: { cityInfo: Airport, airports: Airport[] } } = {};
        validSuggestions.forEach(airport => {
          if (!grouped[airport.city_name]) grouped[airport.city_name] = { cityInfo: airport, airports: [] };
          grouped[airport.city_name].airports.push(airport);
        });
        // --- GROUPING LOGIC END ---

         if (query === debouncedQuery) {
            setSuggestions(validSuggestions);
            setIsDropdownOpen(validSuggestions.length > 0 && query !== currentFormattedSelection && query.length > 0);
            setActiveIndex(-1);
         }
      } catch (error) {
        console.error("Failed to fetch airport suggestions:", error);
        setSuggestions([]); setIsDropdownOpen(false);
      } finally {
        if (query === debouncedQuery) setIsLoading(false);
      }
    };

    if (query !== '' && query !== currentFormattedSelection) {
      fetchSuggestions();
    } else {
        setSuggestions([]);
        setIsDropdownOpen(false);
    }
  }, [debouncedQuery, query, selectedAirport, getFormattedDisplay]);


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
      setSuggestions([]); setIsDropdownOpen(false);
    } else if (selectedAirport) {
      // If user starts typing *over* a selected value, clear the selection state locally
      setSelectedAirport(null);
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
    setSuggestions([]); setIsDropdownOpen(false); setActiveIndex(-1);
    // Set interacting false slightly later to allow state updates
    setTimeout(() => { isInteracting.current = false; }, 100);
  };

   // Handle Focus
   const handleFocus = () => {
        isInteracting.current = true; // User focused
        const currentFormattedSelection = getFormattedDisplay(selectedAirport);

        // If a valid airport is selected AND the input field exactly matches its display value
        if (selectedAirport && query === currentFormattedSelection) {
            console.log(`Clearing input ${id} on focus because a valid selection existed.`);
            setQuery('');               // Clear the visual input
            setSelectedAirport(null);   // Clear the internal selected state
            onAirportSelect(null, null, null); // **Crucially, clear the parent state**
            setSuggestions([]);         // Ensure suggestions are cleared
            setIsDropdownOpen(false);   // Ensure dropdown is closed
            setActiveIndex(-1);         // Reset keyboard nav index
        }
        // Reopen dropdown if there are suggestions relevant to current query (and query isn't empty/selected)
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
           handleSuggestionClick(suggestions[0]); // Select the only one
         } else {
           setIsDropdownOpen(false); // Close dropdown if Enter pressed with no selection highlighted
         }
         break;
      case 'Escape':
        setIsDropdownOpen(false); setActiveIndex(-1);
        break;
      default: // Allow other keys like Tab, Shift, etc.
        break;
    }
    // Set interacting false slightly later, except maybe for enter/escape?
    setTimeout(() => { isInteracting.current = false; }, 100);
  };


  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const activeItem = listRef.current.children[activeIndex] as HTMLLIElement;
    if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);


  // Helper to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return [text];
    const regex = new RegExp(`(${query})`, 'ig');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <b key={i} className="font-bold text-blue-700">{part}</b> : part
    );
  };

  // Group suggestions by city for rendering
  const grouped: { [city: string]: { cityInfo: Airport, airports: Airport[] } } = {};
  suggestions.forEach((airport: Airport) => {
    if (!grouped[airport.city_name]) grouped[airport.city_name] = { cityInfo: airport, airports: [] };
    grouped[airport.city_name].airports.push(airport);
  });
  const groupedSuggestions: { city: Airport; airports: Airport[] }[] = Object.entries(grouped).map(([city, { cityInfo, airports }]) => ({
    city: cityInfo,
    airports
  }));

  // --- Render ---
  // (The JSX return statement you cut and pasted)
  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
          type="text" id={id} name={id} placeholder={placeholder} value={query}
          onChange={handleInputChange} onKeyDown={handleKeyDown} onFocus={handleFocus}
          onBlur={() => setTimeout(() => { if (containerRef.current && !containerRef.current.contains(document.activeElement)) setIsDropdownOpen(false); }, 150)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
          autoComplete="off" />
      {/* Loading Spinner */}
      {isLoading && <div className="absolute right-2 top-[34px] h-5 w-5 animate-spin rounded-full border-2 border-t-blue-600 border-gray-200"></div>}
      {/* Suggestions Dropdown */}
      {isDropdownOpen && groupedSuggestions.length > 0 && (
        <ul ref={listRef} className="absolute z-20 mt-1 max-h-72 w-full min-w-[300px] sm:w-[400px] md:w-[450px] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
          {groupedSuggestions.map((group, groupIdx) => (
            <li key={group.city.city_code + '-group'} className="">
              {/* Selectable City Group Option */}
              <div
                className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-100 font-semibold text-gray-900 border-b border-gray-200 bg-gray-50"
                tabIndex={0}
                onMouseDown={() => {
                  const allCodes = group.airports.map(a => a.airport_code).join(',');
                  const displayValue = `${group.city.city_name} – All Airports (${group.airports.map(a => a.airport_code).join(', ')})`;
                  onAirportSelect(allCodes, group.city.city_code, displayValue);
                  setQuery(displayValue);
                  setIsDropdownOpen(false);
                  setSuggestions([]);
                  setActiveIndex(-1);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    const allCodes = group.airports.map(a => a.airport_code).join(',');
                    const displayValue = `${group.city.city_name} – All Airports (${group.airports.map(a => a.airport_code).join(', ')})`;
                    onAirportSelect(allCodes, group.city.city_code, displayValue);
                    setQuery(displayValue);
                    setIsDropdownOpen(false);
                    setSuggestions([]);
                    setActiveIndex(-1);
                  }
                }}
              >
                <FaCity className="mr-2 text-blue-500" />
                <span>{highlightMatch(`${group.city.city_name} – All Airports (${group.airports.map(a => a.airport_code).join(', ')})`, query)}</span>
              </div>
              {/* Airports under city */}
              {group.airports.map((airport, index) => (
                <div key={airport.airport_code}
                  onMouseDown={() => handleSuggestionClick(airport)}
                  onMouseEnter={() => setActiveIndex(suggestions.findIndex(a => a.airport_code === airport.airport_code))}
                  className={`flex items-start px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${suggestions[activeIndex]?.airport_code === airport.airport_code ? 'bg-blue-100' : ''}`}
                >
                  <FaPlane className="mt-1 mr-2 text-blue-400" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      {highlightMatch(`${airport.airport_name} (${airport.airport_code})`, query)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {airport.city_name}
                      {airport.country_code ? ` – ${airport.country_code}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AirportSearchInput; // Export the component