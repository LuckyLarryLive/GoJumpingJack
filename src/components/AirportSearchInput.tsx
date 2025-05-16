'use client'; // Essential for components using hooks like useState, useEffect

import React, { useState, useEffect, useRef, useCallback } from 'react';
import useDebounce from '@/hooks/useDebounce'; // Import the extracted hook
import type { Airport } from '@/types/airport'; // Import the Airport type
import { FaPlane, FaCity } from 'react-icons/fa';

// --- Component Props Interface ---
interface AirportSearchInputProps {
  id: string;
  label: string;
  placeholder: string;
  onAirportSelect: (
    airportCode: string | null, // IATA for single, comma-separated for city
    displayValue: string | null, // Full string for display in input
    selectionType: 'airport' | 'city' | null, // Type of selection
    cityNameForApi: string | null,    // Explicit city name for API call
    countryCodeForApi: string | null, // Explicit country code for API call
    regionForApi?: string | null      // Explicit region for API call (optional)
  ) => void;
  initialDisplayValue?: string | null;
  currentValue?: string | null; 
}

// --- Airport Search Input Component ---
const AirportSearchInput: React.FC<AirportSearchInputProps> = ({
  id,
  label,
  placeholder,
  onAirportSelect,
  initialDisplayValue,
  currentValue,
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
  const isInteracting = useRef(false);

  // --- Helper functions, Effects, Handlers ---
  // (All the functions and useEffects from the original component go here)

  // Helper to format display string
  const getFormattedDisplay = useCallback((airport: Airport | null): string => {
    if (!airport) return '';
    
    console.log('[AirportSearchInput] Formatting display for airport:', {
      name: airport.name,
      code: airport.code,
      city: airport.city,
      state: airport.state,
      country: airport.country
    });
    
    // Format: "Airport Name (IATA) - City, Region, Country"
    const parts = [
      `${airport.name} (${airport.code})`,
      airport.city || '',
      airport.state || '',
      airport.country || ''
    ].filter(Boolean); // Remove empty strings
    
    const formatted = parts.join(' - ');
    console.log('[AirportSearchInput] Formatted display:', formatted);
    return formatted;
  }, []);

  // Helper to condense display value for input field
  const getCondensedDisplay = useCallback((displayValue: string | null): string => {
    if (!displayValue) return '';
    
    // If it's an "All Airports" selection, condense it
    if (displayValue.includes(' – All Airports')) {
      const cityName = displayValue.split(' – All Airports')[0];
      return `${cityName} (All Airports)`;
    }
    
    return displayValue;
  }, []);

  // Effect to sync with currentValue from parent
  useEffect(() => {
    if (!isInteracting.current && currentValue !== undefined) {
      console.log(`[AirportSearchInput] Syncing input ${id} with currentValue:`, currentValue);
      const condensedValue = getCondensedDisplay(currentValue);
      
      // Only update if we're not in the middle of a search
      if (!debouncedQuery || debouncedQuery.length < 3) {
        setQuery(condensedValue || '');
        
        // Only update selectedAirport if the value has actually changed
        if (!currentValue) {
          if (selectedAirport !== null) {
            setSelectedAirport(null);
          }
        } else if (!selectedAirport || getFormattedDisplay(selectedAirport) !== currentValue) {
          // Try to find matching airport in suggestions
          const matchingAirport = suggestions.find(a => getFormattedDisplay(a) === currentValue);
          if (matchingAirport) {
            setSelectedAirport(matchingAirport);
          } else {
            setSelectedAirport(null);
          }
        }
        setIsDropdownOpen(false);
      }
    }
    // Reset interaction flag after sync attempt
    isInteracting.current = false;
  }, [currentValue, selectedAirport, getFormattedDisplay, getCondensedDisplay, suggestions, id, debouncedQuery]);

  // Effect to sync with initialDisplayValue from parent (for initial mount)
  useEffect(() => {
    if (!isInteracting.current && initialDisplayValue !== undefined) {
      console.log(`[AirportSearchInput] Syncing input ${id} with initialDisplayValue:`, initialDisplayValue);
      const condensedValue = getCondensedDisplay(initialDisplayValue);
      
      // Only update if we're not in the middle of a search
      if (!debouncedQuery || debouncedQuery.length < 3) {
        setQuery(condensedValue || '');
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
  }, [initialDisplayValue, selectedAirport, getFormattedDisplay, getCondensedDisplay, debouncedQuery]);

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
    if (debouncedQuery.length < 3) {
      setSuggestions([]); setIsDropdownOpen(false); return;
    }

    const fetchSuggestions = async () => {
      if (query === currentFormattedSelection && selectedAirport) {
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search-airports?q=${encodeURIComponent(debouncedQuery)}`);
        console.log('[AirportSearchInput] Fetch response:', response);
        console.log('[AirportSearchInput] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('[AirportSearchInput] API Error:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          setSuggestions([]);
          setIsDropdownOpen(false);
          return;
        }

        const data = await response.json();
        console.log('[AirportSearchInput] Raw API response:', data);

        // Map API keys to expected frontend keys if needed
        const mapped = data.map((a: any) => {
          const airport = {
            code: a.iata_code,
            name: a.name,
            city: a.city_name,
            country: a.country_code,
            state: a.region,
          };
          console.log('[AirportSearchInput] Mapped airport:', airport);
          return airport;
        });
        setSuggestions(mapped);
        console.log('[AirportSearchInput] Suggestions state set to:', mapped);

        // --- GROUPING LOGIC START ---
        const grouped: { [city: string]: { cityInfo: Airport, airports: Airport[] } } = {};
        mapped.forEach((airport: Airport) => {
          const cityKey = airport.city || `airport_${airport.code}`; // Use airport code if city is NULL
          if (!grouped[cityKey]) {
            if (airport.city) {
              grouped[cityKey] = { cityInfo: airport, airports: [] };
            } else {
              grouped[cityKey] = { cityInfo: airport, airports: [airport] };
            }
          }
          if (airport.city) {
            grouped[cityKey].airports.push(airport);
          }
        });
        // --- GROUPING LOGIC END ---

         if (query === debouncedQuery) {
            setSuggestions(mapped);
            setIsDropdownOpen(mapped.length > 0 && query !== currentFormattedSelection && query.length > 0);
            setActiveIndex(-1);
         }
      } catch (error) {
        console.error('[AirportSearchInput] Fetch error:', error);
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

    // Only clear parent state if the input is completely empty (no spaces)
    if (newValue.trim() === '') {
      console.log(`[AirportSearchInput] Input ${id} cleared manually, clearing parent state.`);
      setSelectedAirport(null); // Clear local selection
      onAirportSelect(null, null, null, null, null, null); // Clear parent state with all nulls
      setSuggestions([]); 
      setIsDropdownOpen(false);
    } else if (selectedAirport) {
      // If user starts typing *over* a selected value, clear the selection state locally
      setSelectedAirport(null);
      console.log(`[AirportSearchInput] Input ${id} changed from selected value, clearing local selection.`);
    }
  };

  // Update handleSuggestionClick to handle city selections
  const handleSuggestionClick = (suggestion: Airport) => {
    console.log('[AirportSearchInput] Suggestion clicked:', {
      name: suggestion.name,
      code: suggestion.code,
      city: suggestion.city,
      state: suggestion.state,
      country: suggestion.country,
      raw: suggestion
    });
    
    const displayValue = getFormattedDisplay(suggestion);
    console.log('[AirportSearchInput] Constructed display value for single airport:', displayValue);
    
    const cityNameForApi = suggestion.city;
    const countryCodeForApi = suggestion.country;
    const regionForApi = (suggestion.state && suggestion.state !== suggestion.country) ? suggestion.state : null;

    console.log('[AirportSearchInput] Calling onAirportSelect for SINGLE airport:', {
      airportCode: suggestion.code,
      displayValue,
      selectionType: 'airport',
      cityNameForApi,
      countryCodeForApi,
      regionForApi
    });
    onAirportSelect(
      suggestion.code, 
      displayValue, 
      'airport', 
      cityNameForApi, 
      countryCodeForApi,
      regionForApi
    );
    
    setQuery(displayValue);
    setSelectedAirport(suggestion);
    setIsDropdownOpen(false);
    setSuggestions([]);
  };

  // Add a new function to handle city selection
  const handleCitySelection = (cityName: string, airportCodes: string[]) => {
    console.log('[AirportSearchInput] City selection clicked:', { cityName, airportCodes });
    isInteracting.current = true; 
    
    const firstAirport = suggestions.find(a => airportCodes.includes(a.code)); // Ensure firstAirport is from current suggestions
    console.log('[AirportSearchInput] First airport details for city selection:', firstAirport);
    
    const displayValue = `${cityName} – All Airports (${airportCodes.join(', ')})`;
    const joinedAirportCodes = airportCodes.join(',');

    const cityNameForApi = cityName;
    const countryCodeForApi = firstAirport ? firstAirport.country : null;
    const regionForApi = (firstAirport && firstAirport.state && firstAirport.state !== firstAirport.country) ? firstAirport.state : null;

    console.log('[AirportSearchInput] Calling onAirportSelect for CITY (All Airports):', {
      airportCode: joinedAirportCodes,
      displayValue,
      selectionType: 'city',
      cityNameForApi,
      countryCodeForApi,
      regionForApi
    });
    onAirportSelect(
      joinedAirportCodes, 
      displayValue, 
      'city', 
      cityNameForApi, 
      countryCodeForApi,
      regionForApi
    );
    
    setQuery(displayValue);
    setIsDropdownOpen(false); 
    setSuggestions([]);
    setActiveIndex(-1);
    
    setTimeout(() => { isInteracting.current = false; }, 100);
  };

   // Handle Focus
   const handleFocus = () => {
    isInteracting.current = true; 

    // Only clear if there's no selected airport
    if (!selectedAirport) {
      setQuery('');
      onAirportSelect(null, null, null, null, null, null); // Clear parent state fully
      setSuggestions([]); 
      setIsDropdownOpen(false); 
    }
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


  // Scroll active item into view - Modified to be more stable
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const activeItem = listRef.current.children[activeIndex] as HTMLLIElement;
    if (activeItem) {
      // Only scroll if the item is not fully visible
      const container = listRef.current;
      const itemTop = activeItem.offsetTop;
      const itemBottom = itemTop + activeItem.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.offsetHeight;

      if (itemTop < containerTop || itemBottom > containerBottom) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
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
    const cityKey = airport.city || `airport_${airport.code}`;
    if (!grouped[cityKey]) {
      if (airport.city) {
        grouped[cityKey] = { cityInfo: airport, airports: [] };
      } else {
        grouped[cityKey] = { cityInfo: airport, airports: [airport] };
      }
    }
    if (airport.city) {
      grouped[cityKey].airports.push(airport);
    }
  });

  // Convert grouped object to array, filtering out invalid groups
  const groupedSuggestions: { city: Airport; airports: Airport[] }[] = Object.entries(grouped)
    .map(([city, { cityInfo, airports }]) => ({
      city: cityInfo,
      airports
    }))
    .filter(group => {
      // Only include groups that have a valid city name and multiple airports
      return group.city.city && group.airports.length > 1;
    });

  // Add render-time debug logging
  console.log('[AirportSearchInput][RENDER]', {
    id,
    query,
    suggestions,
    isDropdownOpen,
    selectedAirport
  });

  // Modified hover handling for list items
  const handleItemHover = (index: number) => {
    // Only update activeIndex if it's different to prevent unnecessary re-renders
    if (activeIndex !== index) {
      setActiveIndex(index);
    }
  };

  // --- Render ---
  console.log('[AirportSearchInput] Rendering suggestions:', suggestions);
  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        id={id}
        name={id}
        placeholder={placeholder}
        value={isInteracting.current ? query : (currentValue || '')}
        onChange={(e) => {
          isInteracting.current = true;
          const newValue = e.target.value;
          setQuery(newValue);
          
          if (newValue.trim() === '') {
            setSelectedAirport(null);
            onAirportSelect(null, null, null, null, null, null); 
            setSuggestions([]);
            setIsDropdownOpen(false);
          } else if (selectedAirport) {
            setSelectedAirport(null);
          }
        }}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={() => {
          setTimeout(() => { 
            if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
              setIsDropdownOpen(false);
              isInteracting.current = false;
            }
          }, 150);
        }}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-white/25 backdrop-blur-sm"
        autoComplete="off"
      />
      {isLoading && <div className="absolute right-2 top-[34px] h-5 w-5 animate-spin rounded-full border-2 border-t-blue-600 border-gray-200"></div>}
      {isDropdownOpen && (groupedSuggestions.length > 0 || suggestions.length > 0) && (
        <ul ref={listRef} className="absolute z-20 mt-1 max-h-72 w-full min-w-[300px] sm:w-[400px] md:w-[450px] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Render grouped city suggestions (multiple airports) */}
          {groupedSuggestions.map((group, groupIdx) => (
            <li key={group.city.city + '-group'} className="">
              {group.city.city && group.airports.length > 1 && (
                <div
                  className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-100 font-semibold text-gray-900 border-b border-gray-200 bg-gray-50"
                  tabIndex={0}
                  onMouseDown={() => handleCitySelection(group.city.city, group.airports.map(a => a.code))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleCitySelection(group.city.city, group.airports.map(a => a.code));
                    }
                  }}
                >
                  <FaCity className="mr-2 text-blue-500" />
                  <span>{highlightMatch(`${group.city.city} – All Airports (${group.airports.map(a => a.code).join(', ')})`, query)}</span>
                </div>
              )}
              {group.airports.map((airport: Airport) => (
                <div 
                  key={airport.code}
                  onMouseDown={(e) => {
                    e.preventDefault(); 
                    console.log('[AirportSearchInput] Airport suggestion clicked:', {
                      code: airport.code,
                      name: airport.name,
                      city: airport.city,
                      country: airport.country,
                      state: airport.state,
                      raw: airport
                    });
                    
                    const displayValue = getFormattedDisplay(airport);
                    console.log('[AirportSearchInput] Formatted display value:', displayValue);
                    
                    console.log('[AirportSearchInput] Will call parent with:', {
                      airportCode: airport.code,
                      city: airport.city,
                      displayValue
                    });
                    
                    handleSuggestionClick(airport);
                  }}
                  onMouseEnter={() => handleItemHover(suggestions.findIndex(a => a.code === airport.code))}
                  className={`flex items-start px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${suggestions[activeIndex]?.code === airport.code ? 'bg-blue-100' : ''}`}
                >
                  <FaPlane className="mt-1 mr-2 text-blue-400" />
                  <div>
                    <div className="font-semibold text-gray-800">
                      {highlightMatch(`${airport.name} (${airport.code})`, query)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {airport.city ? airport.city : ''}
                      {airport.city && airport.state ? `, ${airport.state}` : (!airport.city && airport.state ? airport.state : '')}
                      {(airport.city || airport.state) && airport.country ? ` – ${airport.country}` : (!airport.city && !airport.state && airport.country ? airport.country : '')}
                    </div>
                  </div>
                </div>
              ))}
            </li>
          ))}
          {/* Render individual airports not in any group (e.g., single-airport results like JFK) */}
          {suggestions
            .filter(a => !groupedSuggestions.some(g => g.airports.some(ga => ga.code === a.code)))
            .map((airport: Airport) => (
              <div 
                key={airport.code}
                onMouseDown={(e) => {
                  e.preventDefault(); 
                  console.log('[AirportSearchInput] Airport suggestion clicked:', {
                    code: airport.code,
                    name: airport.name,
                    city: airport.city,
                    country: airport.country,
                    state: airport.state,
                    raw: airport
                  });
                  const displayValue = getFormattedDisplay(airport);
                  console.log('[AirportSearchInput] Formatted display value:', displayValue);
                  console.log('[AirportSearchInput] Will call parent with:', {
                    airportCode: airport.code,
                    city: airport.city,
                    displayValue
                  });
                  handleSuggestionClick(airport);
                }}
                onMouseEnter={() => handleItemHover(suggestions.findIndex(a => a.code === airport.code))}
                className={`flex items-start px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${suggestions[activeIndex]?.code === airport.code ? 'bg-blue-100' : ''}`}
              >
                <FaPlane className="mt-1 mr-2 text-blue-400" />
                <div>
                  <div className="font-semibold text-gray-800">
                    {highlightMatch(`${airport.name} (${airport.code})`, query)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {airport.city ? airport.city : ''}
                    {airport.city && airport.state ? `, ${airport.state}` : (!airport.city && airport.state ? airport.state : '')}
                    {(airport.city || airport.state) && airport.country ? ` – ${airport.country}` : (!airport.city && !airport.state && airport.country ? airport.country : '')}
                  </div>
                </div>
              </div>
            ))}
        </ul>
      )}
    </div>
  );
};

export default AirportSearchInput;