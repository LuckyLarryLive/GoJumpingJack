'use client';

import { useState, Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import FlightResults from '@/components/FlightResults';
import { FaFilter } from 'react-icons/fa';

// Create a client component for the main content
function FlightsContent() {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('price');
  const [filters, setFilters] = useState({
    maxPrice: '',
    airlines: [] as string[],
    maxStops: '',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Extract search parameters
  const allSearchParamsRaw = searchParams.get('allSearchParams');
  let parsedSearchParams: unknown[] = [];
  if (allSearchParamsRaw) {
    try {
      parsedSearchParams = JSON.parse(decodeURIComponent(allSearchParamsRaw));
    } catch {
      parsedSearchParams = [];
    }
  }
  const origin = searchParams.get('originAirport');
  const destination = searchParams.get('destinationAirport');
  const departureDate = searchParams.get('departureDate');
  const returnDate = searchParams.get('returnDate');
  const adults = searchParams.get('adults');
  const cabinClass = searchParams.get('cabinClass');

  // Use allSearchParams if present, otherwise fallback to single param
  const effectiveSearchParams =
    parsedSearchParams.length > 0
      ? parsedSearchParams
      : [
          {
            originAirport: origin || '',
            destinationAirport: destination || '',
            departureDate: departureDate || '',
            returnDate: returnDate || '',
            adults: parseInt(adults || '1', 10),
            cabinClass: cabinClass || 'economy',
          },
        ];

  // Helper to get city names for summary
  const getSummaryString = useMemo(() => {
    if (!effectiveSearchParams || effectiveSearchParams.length === 0) return '';
    const first = effectiveSearchParams[0];
    let originLabel = '';
    if (first.fromCityNameForApi) {
      originLabel = first.fromCityNameForApi;
    } else if (
      first.originAirport &&
      first.originAirport.includes(',') &&
      first.fromCityNameForApi
    ) {
      originLabel = first.fromCityNameForApi;
    } else {
      originLabel = first.originAirport;
    }
    let destinationLabel = '';
    if (first.toCityNameForApi) {
      destinationLabel = first.toCityNameForApi;
    } else if (
      first.destinationAirport &&
      first.destinationAirport.includes(',') &&
      first.toCityNameForApi
    ) {
      destinationLabel = first.toCityNameForApi;
    } else {
      destinationLabel = first.destinationAirport;
    }
    const departureDates = Array.from(
      new Set(Array.isArray(effectiveSearchParams) ? effectiveSearchParams.map((p: unknown) => (p as { departureDate: string }).departureDate) : [])
    );
    const returnDates = Array.from(
      new Set(Array.isArray(effectiveSearchParams) ? effectiveSearchParams.map((p: unknown) => (p as { returnDate?: string }).returnDate).filter(Boolean) : [])
    );
    return [
      String(`Flights from ${originLabel} to ${destinationLabel}`),
      <br key="br1" />,
      departureDates.length === 1 ? <span key="dep">Departure: {departureDates[0]}</span> : null,
      returnDates.length === 1 ? [<br key="br2" />, `Return: ${returnDates[0]}`] : null,
    ] as React.ReactNode[];
  }, [effectiveSearchParams]);

  // Filtering logic for flights
  const filterFlightsByStops = (flights: unknown[]) => {
    if (!Array.isArray(flights) || !filters.maxStops) return flights || [];
    const maxStops = filters.maxStops;
    return flights.filter(flight => {
      if (maxStops === '0') return flight.stops === 0;
      if (maxStops === '1') return flight.stops === 1;
      if (maxStops === '2') return flight.stops === 2;
      if (maxStops === '3') return flight.stops >= 3;
      return true;
    });
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full">
        {/* Filters Sidebar */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-lg shadow p-4 w-full">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaFilter className="mr-2" /> Filters
            </h2>

            {/* Price Filter */}
            <div className="mb-4">
              <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                Max Price
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full p-3 border rounded-lg text-base sm:text-sm"
                placeholder="Enter max price"
              />
            </div>

            {/* Stops Filter */}
            <div className="mb-4">
              <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                Max Stops
              </label>
              <select
                value={filters.maxStops}
                onChange={e => setFilters({ ...filters, maxStops: e.target.value })}
                className="w-full p-3 border rounded-lg text-base sm:text-sm"
              >
                <option value="">Any</option>
                <option value="0">Non-Stop</option>
                <option value="1">1 Stop</option>
                <option value="2">2 Stops</option>
                <option value="3">3+ Stops</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full">
          {/* Sort Controls */}
          <div className="bg-white rounded-lg shadow p-4 mb-6 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
              <div>
                <div className="text-xl sm:text-2xl font-bold break-words max-w-full">
                  {((): React.ReactNode => {
                    if (!effectiveSearchParams || effectiveSearchParams.length === 0) return null;
                    const first = effectiveSearchParams[0];
                    let originLabel = '';
                    if (first.fromCityNameForApi) {
                      originLabel = first.fromCityNameForApi;
                    } else if (
                      first.originAirport &&
                      first.originAirport.includes(',') &&
                      first.fromCityNameForApi
                    ) {
                      originLabel = first.fromCityNameForApi;
                    } else {
                      originLabel = first.originAirport;
                    }
                    let destinationLabel = '';
                    if (first.toCityNameForApi) {
                      destinationLabel = first.toCityNameForApi;
                    } else if (
                      first.destinationAirport &&
                      first.destinationAirport.includes(',') &&
                      first.toCityNameForApi
                    ) {
                      destinationLabel = first.toCityNameForApi;
                    } else {
                      destinationLabel = first.destinationAirport;
                    }
                    return `Flights from ${originLabel} to ${destinationLabel}`;
                  })()}
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="p-3 border rounded-lg text-base sm:text-sm w-full sm:w-auto"
                >
                  <option value="price">Price: Low to High</option>
                  <option value="duration">Duration: Shortest</option>
                  <option value="departure">Departure: Earliest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Flight Results */}
          <FlightResults
            searchParams={effectiveSearchParams}
            showPagination={true}
            onPageChange={setCurrentPage}
            currentPage={currentPage}
            filterFlights={filterFlightsByStops}
            sortBy={sortBy}
          />
        </div>
      </div>
    </div>
  );
}

// Loading component
function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    </div>
  );
}

// Main page component
export default function AllFlightsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FlightsContent />
    </Suspense>
  );
}
