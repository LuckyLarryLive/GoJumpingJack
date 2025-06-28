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
    { value: 'first', label: 'First' },
  ],
  maxConnections: 2,
  minConnectionTime: 30, // minutes
  maxConnectionTime: 24 * 60, // minutes
  maxOffersPerRequest: 200,
};

// --- Component Props Interface ---
interface SearchSectionProps {
  onSearchSubmit: (searchParams: SearchParamsType[], destinationCityName?: string, destinationCountryCode?: string) => void;
  initialSearchParams?: SearchParamsType;
}

// --- Search Section Component ---
const SearchSection: React.FC<SearchSectionProps> = ({ onSearchSubmit, initialSearchParams }) => {
  // State for form fields
  const [originAirportCode, setOriginAirportCode] = useState<string>('');
  const [destinationAirportCode, setDestinationAirportCode] = useState<string>('');
  const [originDisplayValue, setOriginDisplayValue] = useState<string>('');
  const [destinationDisplayValue, setDestinationDisplayValue] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [adults, setAdults] = useState<number>(1);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip');
  const [passengers, setPassengers] = useState({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [cabinClass, setCabinClass] = useState<string>('economy');
  const [currency, setCurrency] = useState<string>('USD');
  const [maxConnections, setMaxConnections] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [destinationSelectionType, setDestinationSelectionType] = useState<
    'airport' | 'city' | null
  >(null);
  const [destinationCityNameForApi, setDestinationCityNameForApi] = useState<string | null>(null);
  const [destinationCountryCodeForApi, setDestinationCountryCodeForApi] = useState<string | null>(
    null
  );
  const [destinationRegionForApi, setDestinationRegionForApi] = useState<string | null>(null);
  const [originSelectionType, setOriginSelectionType] = useState<'airport' | 'city' | null>(null);
  const [originCityNameForApi, setOriginCityNameForApi] = useState<string | null>(null);
  const [originCountryCodeForApi, setOriginCountryCodeForApi] = useState<string | null>(null);
  const [originRegionForApi, setOriginRegionForApi] = useState<string | null>(null);

  // Calculate today's date for min attribute on date inputs
  const today = new Date().toISOString().split('T')[0];

  // Initialize form with search params if provided
  useEffect(() => {
    if (initialSearchParams) {
      setOriginAirportCode(initialSearchParams.originAirport);
      setDestinationAirportCode(initialSearchParams.destinationAirport);
      setOriginDisplayValue(initialSearchParams.fromDisplayValue || '');
      setDestinationDisplayValue(initialSearchParams.toDisplayValue || '');
      setDestinationCityNameForApi(initialSearchParams.toCityNameForApi || null);
      setDestinationCountryCodeForApi(initialSearchParams.toCountryCodeForApi || null);
      setDestinationRegionForApi(initialSearchParams.toRegionForApi || null);
      setDestinationSelectionType(initialSearchParams.toSelectionType || null);
      setDepartureDate(initialSearchParams.departureDate);
      setReturnDate(initialSearchParams.returnDate || '');
      setAdults(initialSearchParams.adults);
      setIsMinimized(true);
      setPassengers({
        adults: initialSearchParams.adults,
        children: initialSearchParams.children || 0,
        infants: initialSearchParams.infants || 0,
      });
      setCabinClass(initialSearchParams.cabinClass || 'economy');
      setCurrency(initialSearchParams.currency || 'USD');
      setMaxConnections(initialSearchParams.maxConnections || 0);
      setOriginSelectionType(initialSearchParams.fromSelectionType || null);
      setOriginCityNameForApi(initialSearchParams.fromCityNameForApi || null);
      setOriginCountryCodeForApi(initialSearchParams.fromCountryCodeForApi || null);
      setOriginRegionForApi(initialSearchParams.fromRegionForApi || null);
    }
  }, [initialSearchParams]);



  // --- Handler for From Airport Selection ---
  const handleFromAirportSelect = useCallback(
    (
      airportCode: string | null,
      displayValue: string | null,
      selectionType: 'airport' | 'city' | null,
      cityNameForApi: string | null,
      countryCodeForApi: string | null,
      regionForApi?: string | null
    ) => {
      console.log('[SearchSection] From airport selected:', {
        airportCode,
        displayValue,
        selectionType,
        cityNameForApi,
        countryCodeForApi,
        regionForApi,
      });
      setOriginAirportCode(airportCode || '');
      setOriginDisplayValue(displayValue || '');
      setOriginSelectionType(selectionType);
      setOriginCityNameForApi(cityNameForApi);
      setOriginCountryCodeForApi(countryCodeForApi);
      setOriginRegionForApi(regionForApi || null);
    },
    []
  );

  // --- Handler for To Airport Selection ---
  const handleToAirportSelect = useCallback(
    (
      airportCode: string | null,
      displayValue: string | null,
      selectionType: 'airport' | 'city' | null,
      cityNameForApi: string | null,
      countryCodeForApi: string | null,
      regionForApi?: string | null
    ) => {
      console.log('[SearchSection] To airport selected (received from AirportSearchInput):', {
        airportCode,
        displayValue,
        selectionType,
        cityNameForApi,
        countryCodeForApi,
        regionForApi,
      });

      setDestinationAirportCode(airportCode || '');
      setDestinationDisplayValue(displayValue || '');
      setDestinationSelectionType(selectionType);
      setDestinationCityNameForApi(cityNameForApi);
      setDestinationCountryCodeForApi(countryCodeForApi);
      setDestinationRegionForApi(regionForApi || null);
    },
    []
  );

  // --- Handler for Trip Type Radio Buttons ---
  const handleTripTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTripType = event.target.value as 'round-trip' | 'one-way';
    setTripType(newTripType);
    if (newTripType === 'one-way') {
      setReturnDate(''); // Clear return date for one-way trips
    }
  };

  // --- Form Submission Handler ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originAirportCode || !destinationAirportCode || !departureDate || !adults) {
      setError('Please fill in all required fields');
      return;
    }

    // Split airport codes and handle city searches
    const originAirports = originAirportCode.split(',');
    const destinationAirports = destinationAirportCode.split(',');

    // Prepare search params for each combination
    const searchParamsList: SearchParamsType[] = [];

    // If either origin or destination is a city (has multiple airports)
    if (Array.isArray(originAirports) && Array.isArray(destinationAirports) && (originAirports.length > 1 || destinationAirports.length > 1)) {
      // Create a search for each airport combination
      originAirports.forEach(origin => {
        destinationAirports.forEach(destination => {
          const searchParams: SearchParamsType = {
            originAirport: origin,
            destinationAirport: destination,
            departureDate,
            adults,
            children: passengers.children || undefined,
            infants: passengers.infants || undefined,
            cabinClass,
            currency,
            maxConnections,
            fromDisplayValue: originDisplayValue,
            toDisplayValue: destinationDisplayValue,
            fromCityNameForApi: originCityNameForApi || undefined,
            fromCountryCodeForApi: originCountryCodeForApi || undefined,
            fromRegionForApi: originRegionForApi || undefined,
            fromSelectionType: originSelectionType || undefined,
            toCityNameForApi: destinationCityNameForApi || undefined,
            toCountryCodeForApi: destinationCountryCodeForApi || undefined,
            toRegionForApi: destinationRegionForApi || undefined,
            toSelectionType: destinationSelectionType || undefined,
          };
          if (returnDate) {
            searchParams.returnDate = returnDate;
          }
          searchParamsList.push(searchParams);
        });
      });
    } else {
      // Single airport to single airport search
      const searchParams: SearchParamsType = {
        originAirport: originAirportCode,
        destinationAirport: destinationAirportCode,
        departureDate,
        adults,
        children: passengers.children || undefined,
        infants: passengers.infants || undefined,
        cabinClass,
        currency,
        maxConnections,
        fromDisplayValue: originDisplayValue,
        toDisplayValue: destinationDisplayValue,
        fromCityNameForApi: originCityNameForApi || undefined,
        fromCountryCodeForApi: originCountryCodeForApi || undefined,
        fromRegionForApi: originRegionForApi || undefined,
        fromSelectionType: originSelectionType || undefined,
        toCityNameForApi: destinationCityNameForApi || undefined,
        toCountryCodeForApi: destinationCountryCodeForApi || undefined,
        toRegionForApi: destinationRegionForApi || undefined,
        toSelectionType: destinationSelectionType || undefined,
      };
      if (returnDate) {
        searchParams.returnDate = returnDate;
      }
      searchParamsList.push(searchParams);
    }

    // Call onSearchSubmit with the list of search params and destination info
    onSearchSubmit(
      searchParamsList,
      destinationCityNameForApi || undefined,
      destinationCountryCodeForApi || undefined
    );
    setIsMinimized(true);
  };

  // --- Handler to Re-expand the Form ---
  const handleEditFilters = () => {
    setIsMinimized(false);
  };

  // Add validation for passenger counts
  const validatePassengerCounts = (newPassengers: typeof passengers) => {
    const total = newPassengers.adults + newPassengers.children + newPassengers.infants;
    if (total > DUFFEL_CONSTRAINTS.maxPassengers) {
      return false;
    }
    if (newPassengers.infants > newPassengers.adults) {
      return false;
    }
    if (newPassengers.infants > 9) {
      return false;
    }
    return true;
  };

  const handlePassengerChange = (type: keyof typeof passengers, value: number) => {
    const newPassengers = { ...passengers, [type]: value };
    if (validatePassengerCounts(newPassengers)) {
      setPassengers(newPassengers);
      setAdults(newPassengers.adults);
    }
  };

  // --- Render Logic ---

  // Minimized View
  if (isMinimized) {
    return (
      <section
        id="search"
        className="py-6 bg-blue-200"
      >
        <div className="container mx-auto px-2 sm:px-4">
          <div
            className="bg-white p-4 rounded-lg shadow-sm mx-auto w-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
              <div className="flex-1 w-full">
                <div className="flex flex-wrap gap-4 w-full">
                  <div>
                    <span className="text-base sm:text-sm text-gray-500">From</span>
                    <p className="font-medium break-words max-w-full">
                      {originSelectionType === 'city' && originCityNameForApi
                        ? originCityNameForApi
                        : originAirportCode}
                    </p>
                  </div>
                  <div>
                    <span className="text-base sm:text-sm text-gray-500">To</span>
                    <p className="font-medium break-words max-w-full">
                      {destinationSelectionType === 'city' && destinationCityNameForApi
                        ? destinationCityNameForApi
                        : destinationAirportCode}
                    </p>
                  </div>
                  <div>
                    <span className="text-base sm:text-sm text-gray-500">Dates</span>
                    <p className="font-medium break-words max-w-full">
                      {departureDate} {returnDate ? `- ${returnDate}` : '(One-way)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-base sm:text-sm text-gray-500">Passengers</span>
                    <p className="font-medium break-words max-w-full">
                      {adults + passengers.children}{' '}
                      {passengers.infants > 0 ? `+ ${passengers.infants} infant` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="text-base sm:text-sm text-gray-500">Class</span>
                    <p className="font-medium capitalize break-words max-w-full">
                      {cabinClass.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleEditFilters}
                className="text-blue-600 hover:text-blue-800 font-medium mt-4 sm:mt-0 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-all"
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
    <section
      id="search"
      className="py-6 bg-blue-200 scroll-mt-24"
    >
      <div className="container mx-auto px-2 sm:px-4">
        <div className="bg-white/75 backdrop-blur-sm p-4 rounded-lg shadow-lg mx-auto w-full">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
          >
            {/* Trip Type Toggle */}
            <div className="md:col-span-2 lg:col-span-4 flex items-center space-x-4 mb-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="tripType"
                  value="round-trip"
                  checked={tripType === 'round-trip'}
                  onChange={handleTripTypeChange}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-base sm:text-sm">Round Trip</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="tripType"
                  value="one-way"
                  checked={tripType === 'one-way'}
                  onChange={handleTripTypeChange}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2 text-base sm:text-sm">One Way</span>
              </label>
            </div>

            {/* From Airport Input */}
            <div>
              <AirportSearchInput
                id="from"
                label="From"
                placeholder="City or airport"
                onAirportSelect={handleFromAirportSelect}
                initialDisplayValue={originDisplayValue}
                currentValue={originDisplayValue}
              />
            </div>
            {/* To Airport Input */}
            <div>
              <AirportSearchInput
                id="to"
                label="To"
                placeholder="City or airport"
                onAirportSelect={handleToAirportSelect}
                initialDisplayValue={destinationDisplayValue}
                currentValue={destinationDisplayValue}
              />
            </div>

            {/* Date Inputs */}
            <div>
              <label
                htmlFor="departure-date"
                className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
              >
                Depart
              </label>
              <input
                type="date"
                id="departure-date"
                name="departure-date"
                required
                value={departureDate}
                onChange={e => setDepartureDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white/25 backdrop-blur-sm text-base sm:text-sm"
                min={today}
              />
            </div>
            <div>
              <label
                htmlFor="return-date"
                className="block text-base sm:text-sm font-medium text-gray-700 mb-2"
              >
                Return
              </label>
              <input
                type="date"
                id="return-date"
                name="return-date"
                required={tripType === 'round-trip'}
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                disabled={tripType === 'one-way'}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white/25 backdrop-blur-sm text-base sm:text-sm ${tripType === 'one-way' ? 'opacity-50 cursor-not-allowed' : ''}`}
                min={departureDate || today}
              />
            </div>



            {/* Advanced Options Toggle */}
            <div className="md:col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-2"
              >
                {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
                <svg
                  className={`ml-2 w-4 h-4 transform transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Advanced Options */}
            {showAdvancedOptions && (
              <>
                {/* Passengers */}
                <div className="md:col-span-2 lg:col-span-4 flex gap-4 items-start">
                  <div className="flex flex-col flex-1">
                    <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                      Adults
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-base sm:text-sm"
                        onClick={() =>
                          handlePassengerChange('adults', Math.max(1, passengers.adults - 1))
                        }
                        disabled={passengers.adults <= 1}
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold text-base sm:text-sm">
                        {passengers.adults}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-base sm:text-sm"
                        onClick={() =>
                          handlePassengerChange('adults', Math.min(9, passengers.adults + 1))
                        }
                        disabled={passengers.adults >= 9}
                      >
                        +
                      </button>
                    </div>
                    {/* Placeholder for alignment */}
                    <div className="h-5 mt-1"></div>
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                      Children
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-base sm:text-sm"
                        onClick={() =>
                          handlePassengerChange('children', Math.max(0, passengers.children - 1))
                        }
                        disabled={passengers.children <= 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold text-base sm:text-sm">
                        {passengers.children}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-base sm:text-sm"
                        onClick={() =>
                          handlePassengerChange('children', Math.min(8, passengers.children + 1))
                        }
                        disabled={passengers.children >= 8}
                      >
                        +
                      </button>
                    </div>
                    {/* Placeholder for alignment */}
                    <div className="h-5 mt-1"></div>
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                      Infants
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-base sm:text-sm"
                        onClick={() =>
                          handlePassengerChange('infants', Math.max(0, passengers.infants - 1))
                        }
                        disabled={passengers.infants <= 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold text-base sm:text-sm">
                        {passengers.infants}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-base sm:text-sm"
                        onClick={() =>
                          handlePassengerChange(
                            'infants',
                            Math.min(passengers.adults, passengers.infants + 1)
                          )
                        }
                        disabled={passengers.infants >= passengers.adults}
                      >
                        +
                      </button>
                    </div>
                    {/* Disclosure text - positioned to not affect alignment */}
                    <p className="mt-1 text-xs text-gray-500">Max 1 infant per adult</p>
                  </div>
                </div>

                {/* Cabin Class */}
                <div>
                  <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                    Cabin Class
                  </label>
                  <select
                    value={cabinClass}
                    onChange={e => setCabinClass(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white/25 backdrop-blur-sm text-base sm:text-sm"
                  >
                    {DUFFEL_CONSTRAINTS.cabinClasses.map(cabin => (
                      <option key={cabin.value} value={cabin.value}>
                        {cabin.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white/25 backdrop-blur-sm text-base sm:text-sm"
                  >
                    {DUFFEL_CONSTRAINTS.supportedCurrencies.map(curr => (
                      <option key={curr} value={curr}>
                        {curr} (
                        {curr === 'USD'
                          ? '$'
                          : curr === 'EUR'
                            ? '€'
                            : curr === 'GBP'
                              ? '£'
                              : curr === 'CAD'
                                ? 'C$'
                                : 'A$'}
                        )
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Connections */}
                <div>
                  <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                    Max Connections
                  </label>
                  <select
                    value={maxConnections}
                    onChange={e => setMaxConnections(parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white/25 backdrop-blur-sm text-base sm:text-sm"
                  >
                    <option value="0">Non-stop only</option>
                    {Array.from({ length: DUFFEL_CONSTRAINTS.maxConnections }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Max {i + 1} {i === 0 ? 'connection' : 'connections'}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Search Button */}
            <div className="md:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg transition duration-300 text-base sm:text-sm mt-2"
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
