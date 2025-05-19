// src/app/results/ResultsContent.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FlightCard from '@/components/FlightCard';
import { useDuffelFlightSearch, FlightSearchParams } from '@/hooks/useDuffelFlightSearch';

const unique = (arr: string[]) => Array.from(new Set(arr));

// --- Component ---
export default function ResultsContent() {
  const searchParamsHook = useSearchParams();

  // Extract search params
  const originAirport = searchParamsHook.get('originAirport');
  const destinationAirport = searchParamsHook.get('destinationAirport');
  const departureDate = searchParamsHook.get('departureDate');
  const returnDate = searchParamsHook.get('returnDate');
  const adults = searchParamsHook.get('adults');
  const cabinClass = searchParamsHook.get('cabinClass') || 'economy';

  // New Duffel async hook
  const {
    initiateSearch,
    offers,
    meta,
    status,
    error,
    fetchPage,
  } = useDuffelFlightSearch();

  // Filters and pagination
  const [page, setPage] = useState(1);
  const [priceFilter, setPriceFilter] = useState<[number, number] | null>(null);
  const [cabinClassFilter, setCabinClassFilter] = useState<string>('');
  const [airlineFilter, setAirlineFilter] = useState<string>('');
  const pageSize = 10;

  // Initiate search on mount or when params change
  useEffect(() => {
    if (!originAirport || !destinationAirport || !departureDate || !adults) return;
    const params: FlightSearchParams = {
      origin: originAirport,
      destination: destinationAirport,
      departureDate,
      returnDate: returnDate || undefined,
      passengers: { adults: parseInt(adults, 10) },
      cabinClass: cabinClass as any,
    };
    initiateSearch(params);
    setPage(1);
  }, [originAirport, destinationAirport, departureDate, returnDate, adults, cabinClass, initiateSearch]);

  // Filtering and sorting (client-side for now)
  const sortedFlights = Array.isArray(offers) ? [...offers].sort((a, b) => a.price - b.price) : [];
  const minPrice = sortedFlights.length ? sortedFlights[0].price : 0;
  const maxPrice = sortedFlights.length ? sortedFlights[sortedFlights.length - 1].price : 0;
  const filteredFlights = Array.isArray(sortedFlights) ? sortedFlights.filter(flight => {
    let pass = true;
    if (priceFilter) {
      pass = pass && flight.price >= priceFilter[0] && flight.price <= priceFilter[1];
    }
    if (cabinClassFilter) {
      pass = pass && flight.cabin_class === cabinClassFilter;
    }
    if (airlineFilter) {
      pass = pass && flight.airline === airlineFilter;
    }
    return pass;
  }) : [];

  // Pagination logic
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageFlights = Array.isArray(filteredFlights) ? filteredFlights.slice(startIdx, endIdx) : [];
  const totalPages = filteredFlights && filteredFlights.length ? Math.ceil(filteredFlights.length / pageSize) : 1;

  // Render logic
  const renderContent = () => {
    if (status === 'searching' || status === 'pending') {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <video
            src="/Jack_Finding_Flights.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '320px', maxWidth: '90%', borderRadius: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
          />
          <span className="mt-4 text-lg text-blue-700 font-semibold">Jack is finding the best flights for you...</span>
        </div>
      );
    }
    if (status === 'error') {
      return <div className="text-center py-10 text-red-600">Error: {error}</div>;
    }
    if (filteredFlights.length === 0) {
      return (
        <div className="text-center text-gray-600 py-10">
          <p className="text-xl mb-2">No flights found matching your criteria.</p>
          <p>Please try adjusting your search on the <a href="/" className="text-blue-600 hover:underline">homepage</a>.</p>
        </div>
      );
    }
    return (
      <>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          {/* Price Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={minPrice}
                max={maxPrice}
                value={priceFilter ? priceFilter[0] : minPrice}
                onChange={e => setPriceFilter([Number(e.target.value), priceFilter ? priceFilter[1] : maxPrice])}
                className="w-20 p-1 border border-gray-300 rounded"
              />
              <span>-</span>
              <input
                type="number"
                min={minPrice}
                max={maxPrice}
                value={priceFilter ? priceFilter[1] : maxPrice}
                onChange={e => setPriceFilter([priceFilter ? priceFilter[0] : minPrice, Number(e.target.value)])}
                className="w-20 p-1 border border-gray-300 rounded"
              />
              <button
                className="ml-2 px-2 py-1 bg-gray-200 rounded"
                onClick={() => setPriceFilter(null)}
                disabled={!priceFilter}
              >Clear</button>
            </div>
          </div>
          {/* Cabin Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cabin Class</label>
            <select
              value={cabinClassFilter}
              onChange={e => setCabinClassFilter(e.target.value)}
              className="p-1 border border-gray-300 rounded"
            >
              <option value="">All</option>
              {Array.isArray(sortedFlights) && unique(sortedFlights.map(f => f.cabin_class)).map(cabin => (
                <option key={cabin} value={cabin}>{cabin.charAt(0).toUpperCase() + cabin.slice(1).replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          {/* Airline Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Airline</label>
            <select
              value={airlineFilter}
              onChange={e => setAirlineFilter(e.target.value)}
              className="p-1 border border-gray-300 rounded"
            >
              <option value="">All</option>
              {Array.isArray(sortedFlights) && unique(sortedFlights.map(f => f.airline)).map(airline => (
                <option key={airline} value={airline}>{airline}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-4">
          {Array.isArray(pageFlights) && pageFlights.length > 0 ? pageFlights.map((flight, index) => (
            <FlightCard key={`${flight.link || 'flight-result'}-${startIdx + index}`} flight={flight} />
          )) : <div className="text-center text-gray-600 py-10">No flights to display.</div>}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-gray-700">Page {page} of {totalPages}</span>
            <button
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        Flight Results
        {originAirport && destinationAirport && (
          <span className="block text-lg font-normal text-gray-600 mt-1">
            For: {originAirport} to {destinationAirport}
          </span>
        )}
      </h1>
      {renderContent()}
    </div>
  );
}