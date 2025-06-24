import { useState, useRef, useEffect } from 'react';
import { Airport, SearchResult, HighlightedText } from '@/types/airport';
import { searchAirports, getAirportsByCity } from '@/lib/airports';
import { FaPlane } from 'react-icons/fa';

interface AirportSearchProps {
  onSelect: (result: SearchResult) => void;
  placeholder?: string;
}

export default function AirportSearch({
  onSelect,
  placeholder = 'Search for a city or airport',
}: AirportSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highlightText = (text: string, query: string): HighlightedText[] => {
    if (!query) return [{ text, highlight: false }];

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map(part => ({
      text: part,
      highlight: part.toLowerCase() === query.toLowerCase(),
    }));
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }

    console.log('Searching for:', value);
    const searchResults = searchAirports(value);
    console.log('Initial search results:', searchResults);

    // Group airports by city
    const cityMap = new Map<string, Airport[]>();
    searchResults.forEach(airport => {
      const cityKey = airport.city.toLowerCase();
      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, []);
      }
      cityMap.get(cityKey)?.push(airport);
    });

    console.log('City map:', Object.fromEntries(cityMap));

    const formattedResults: SearchResult[] = [];

    // Add city results first
    cityMap.forEach((airports, cityKey) => {
      if (airports.length > 0) {
        formattedResults.push({
          type: 'city',
          code: airports.map(a => a.code).join(','), // Join all airport codes with commas
          name: `${airports[0].city} - All airports (${airports.length})`,
          city: airports[0].city,
          state: airports[0].state,
          country: airports[0].country,
          airports: airports,
        });
      }
    });

    // Add individual airport results
    searchResults.forEach(airport => {
      const cityAirports = cityMap.get(airport.city.toLowerCase());
      if (cityAirports && cityAirports.length === 1) {
        formattedResults.push({
          type: 'airport',
          code: airport.code,
          name: `${airport.name} (${airport.code})`,
          city: airport.city,
          state: airport.state,
          country: airport.country,
        });
      }
    });

    console.log('Final formatted results:', formattedResults);
    setResults(formattedResults);
    setIsOpen(true);
  };

  const handleSelect = (result: SearchResult) => {
    console.log('Selected result:', result);
    onSelect(result);
    setQuery(result.type === 'city' ? result.city : result.name);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <FaPlane className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.code}-${index}`}
              onClick={() => handleSelect(result)}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
            >
              <div className="flex items-center">
                <FaPlane className="text-blue-500 mr-2" />
                <div>
                  <div className="font-medium">
                    {highlightText(result.name, query).map((part, i) => (
                      <span key={i} className={part.highlight ? 'font-bold text-blue-600' : ''}>
                        {part.text}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.city}, {result.state}, {result.country}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
