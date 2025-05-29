import React, { useState, useEffect, useRef } from 'react';
import { FaPlane } from 'react-icons/fa';

interface Airline {
  name: string;
  iataCode: string;
}

interface AirlineSearchInputProps {
  id: string;
  label: string;
  placeholder: string;
  onAirlineSelect: (airlineIataCode: string | null, displayValue: string | null) => void;
  initialDisplayValue?: string | null;
  currentValue?: string | null;
}

const AirlineSearchInput: React.FC<AirlineSearchInputProps> = ({
  id,
  label,
  placeholder,
  onAirlineSelect,
  initialDisplayValue,
  currentValue,
}) => {
  const [query, setQuery] = useState(initialDisplayValue || '');
  const [suggestions, setSuggestions] = useState<Airline[]>([]);
  const [selectedAirline, setSelectedAirline] = useState<Airline | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInteracting = useRef(false);

  // Fetch airlines from API
  useEffect(() => {
    const fetchAirlines = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/duffel/airlines');
        if (!response.ok) throw new Error('Failed to fetch airlines');
        const data = await response.json();
        
        // Filter airlines based on query
        const filteredAirlines = data.airlines.filter((airline: Airline) =>
          airline.name.toLowerCase().includes(query.toLowerCase()) ||
          airline.iataCode.toLowerCase().includes(query.toLowerCase())
        );
        
        setSuggestions(filteredAirlines);
        setIsDropdownOpen(true);
      } catch (error) {
        console.error('Error fetching airlines:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchAirlines, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDropdownOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            handleSuggestionClick(suggestions[activeIndex]);
          }
          break;
        case 'Escape':
          setIsDropdownOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen, suggestions, activeIndex]);

  const handleSuggestionClick = (airline: Airline) => {
    console.log('[AirlineSearchInput] Airline selected:', airline);
    const displayValue = `${airline.name} (${airline.iataCode})`;
    onAirlineSelect(airline.iataCode, displayValue);
    setQuery(displayValue);
    setSelectedAirline(airline);
    setIsDropdownOpen(false);
    setSuggestions([]);
  };

  const handleFocus = () => {
    isInteracting.current = true;
    if (!selectedAirline && !query) {
      setQuery('');
      onAirlineSelect(null, null);
      setSuggestions([]);
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <FaPlane className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {isDropdownOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {suggestions.map((airline, index) => (
            <div
              key={airline.iataCode}
              onClick={() => handleSuggestionClick(airline)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 ${
                index === activeIndex ? 'bg-gray-100' : ''
              }`}
            >
              <div className="flex items-center">
                <FaPlane className="text-blue-500 mr-2" />
                <div>
                  <div className="font-medium">{airline.name}</div>
                  <div className="text-sm text-gray-500">IATA: {airline.iataCode}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AirlineSearchInput; 