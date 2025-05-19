'use client'; // Required for useState, useEffect

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { SearchParamsType, Flight } from '@/types'; // Import shared types
import FlightCard from './FlightCard'; // <--- ADD BACK FlightCard Import
import { useRouter } from 'next/navigation';
import { FaPlane, FaArrowRight, FaClock, FaMoneyBillWave } from 'react-icons/fa';

// --- Component Props Interface ---
interface FlightResultsProps {
  searchParams?: SearchParamsType | null;
  apiUrl?: string;
  showPagination?: boolean;
  onPageChange?: (page: number) => void;
  currentPage?: number;
}

// --- Flight Results Component ---
const FlightResults: React.FC<FlightResultsProps> = ({ 
  searchParams, 
  apiUrl,
  showPagination = false, 
  onPageChange, 
  currentPage = 1 
}) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [offerRequestId, setOfferRequestId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Helper: Filter valid flights (not partial, has outbound segments)
  function filterValidFlights(flights: any[]): Flight[] {
    return flights.filter(flight =>
      !flight.partial &&
      Array.isArray(flight.outbound_segments) && flight.outbound_segments.length > 0
    );
  }

  // Helper: Adjust date by days
  function adjustDate(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  // Helper: Get all cabin classes
  const CABIN_CLASSES = ['economy', 'premium_economy', 'business', 'first'];

  // Helper: Try city search (if not already city)
  function isAirportCode(code: string) {
    return code && code.length === 3 && code.toUpperCase() === code;
  }

  // Main async search with fallbacks
  useEffect(() => {
    if (!searchParams) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setFlights([]);
    setTotalResults(0);

    async function fetchOfferDetails(offerId: string) {
      try {
        const res = await fetch(`/api/flights/offer-details?offer_id=${offerId}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data;
      } catch {
        return null;
      }
    }

    async function doSearch(params: any): Promise<Flight[]> {
      try {
        const payload = {
          origin: params.originAirport,
          destination: params.destinationAirport,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          passengers: { adults: Number(params.adults) },
          cabinClass: params.cabinClass || 'economy',
        };
        const res = await fetch('/api/flights/initiate-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to initiate search');
        // Poll for results
        let offers: any[] = [];
        let pollTries = 0;
        let polling = true;
        while (polling && pollTries < 10) {
          const pollRes = await fetch(`/api/flights/results?offer_request_id=${data.offer_request_id}`);
          const pollData = await pollRes.json();
          if (pollData.status === 'pending') {
            await new Promise(r => setTimeout(r, 1500));
            pollTries++;
          } else if (pollData.status === 'complete') {
            offers = Array.isArray(pollData.offers) ? pollData.offers : [];
            polling = false;
          } else {
            polling = false;
          }
        }
        // Fetch offer details for offers with empty or missing slices
        let detailsFetchCount = 0;
        let stillIncompleteCount = 0;
        const detailedOffers = await Promise.all(offers.map(async (offer) => {
          if (!offer.slices || offer.slices.length === 0) {
            detailsFetchCount++;
            const details = await fetchOfferDetails(offer.id);
            if (details && details.slices && details.slices.length > 0) {
              return { ...offer, slices: details.slices };
            } else {
              stillIncompleteCount++;
              return offer;
            }
          }
          return offer;
        }));
        console.log(`[FlightResults] Offers needing details fetch: ${detailsFetchCount}, still incomplete after fetch: ${stillIncompleteCount}`);
        return filterValidFlights(detailedOffers.map(duffelOfferToFlight));
      } catch (err: any) {
        return [];
      }
    }

    async function searchWithFallbacks() {
      // 1. Try original search
      let params = { ...searchParams };
      let flights = await doSearch(params);
      if (cancelled) return;
      if (flights.length > 0) {
        setFlights(flights);
        setTotalResults(flights.length);
        setIsLoading(false);
        return;
      }
      // 2. Try previous day
      if (typeof params.departureDate === 'string' && params.departureDate) {
        const prevDay = adjustDate(params.departureDate, -1);
        flights = await doSearch({ ...params, departureDate: prevDay });
        if (cancelled) return;
        if (flights.length > 0) {
          setFlights(flights);
          setTotalResults(flights.length);
          setIsLoading(false);
          setError('No flights found for your exact date. Showing results for the previous day.');
          return;
        }
      }
      // 3. Try all cabin classes
      for (const cabin of CABIN_CLASSES) {
        flights = await doSearch({ ...params, cabinClass: cabin });
        if (cancelled) return;
        if (flights.length > 0) {
          setFlights(flights);
          setTotalResults(flights.length);
          setIsLoading(false);
          setError('No flights found for your selected cabin class. Showing results for all cabin classes.');
          return;
        }
      }
      // 4. Try next day
      if (typeof params.departureDate === 'string' && params.departureDate) {
        const nextDay = adjustDate(params.departureDate, 1);
        flights = await doSearch({ ...params, departureDate: nextDay });
        if (cancelled) return;
        if (flights.length > 0) {
          setFlights(flights);
          setTotalResults(flights.length);
          setIsLoading(false);
          setError('No flights found for your exact date. Showing results for the next day.');
          return;
        }
      }
      // 5. Try city search if original was by airport
      if ((typeof params.originAirport === 'string' && isAirportCode(params.originAirport)) || (typeof params.destinationAirport === 'string' && isAirportCode(params.destinationAirport))) {
        const cityParams = { ...params };
        if (typeof params.originAirport === 'string' && isAirportCode(params.originAirport)) cityParams.originAirport = '';
        if (typeof params.destinationAirport === 'string' && isAirportCode(params.destinationAirport)) cityParams.destinationAirport = '';
        flights = await doSearch(cityParams);
        if (cancelled) return;
        if (flights.length > 0) {
          setFlights(flights);
          setTotalResults(flights.length);
          setIsLoading(false);
          setError('No flights found for your selected airports. Showing results for the city.');
          return;
        }
      }
      // If all fail
      setFlights([]);
      setTotalResults(0);
      setIsLoading(false);
      setError('No flights found for your search or similar options. Please try different dates or airports.');
    }

    searchWithFallbacks();
    return () => { cancelled = true; };
  }, [searchParams]);

  // Helper: Transform Duffel offer to Flight shape
  function duffelOfferToFlight(offer: any): Flight {
    // Detailed logging of the offer structure
    console.log('=== Detailed Offer Analysis ===');
    console.log('Offer ID:', offer.id);
    console.log('Airline:', offer.owner?.name);
    console.log('Price:', offer.total_amount, offer.total_currency);
    console.log('Cabin Class:', offer.cabin_class);
    
    // Log slices structure
    console.log('Slices:', offer.slices);
    if (offer.slices && offer.slices.length > 0) {
      offer.slices.forEach((slice: any, idx: number) => {
        console.log(`\nSlice ${idx} Details:`, {
          origin: slice.origin,
          destination: slice.destination,
          segments: slice.segments,
          fare_brand_name: slice.fare_brand_name,
          duration: slice.duration
        });
        
        // Log segments if they exist
        if (slice.segments && slice.segments.length > 0) {
          slice.segments.forEach((segment: any, segIdx: number) => {
            // Log the complete segment object
            console.log(`\nComplete Segment ${segIdx}:`, JSON.stringify(segment, null, 2));
            
            // Log specific fields we're interested in
            console.log(`\nSegment ${segIdx} Key Fields:`, {
              origin: segment.origin,
              destination: segment.destination,
              departure: segment.departing_at || segment.departure,  // Try both possible field names
              arrival: segment.arriving_at || segment.arrival,       // Try both possible field names
              duration: segment.duration,
              operating_carrier: segment.operating_carrier,
              marketing_carrier: segment.marketing_carrier,
              aircraft: segment.aircraft,
              flight_number: segment.flight_number
            });
          });
        } else {
          console.log('No segments found in this slice');
        }
      });
    } else {
      console.log('No slices found in this offer');
    }
    console.log('=== End Offer Analysis ===\n');

    // Defensive: check for slices and segments
    const outboundSegments = offer.slices?.[0]?.segments || [];
    const returnSegments = offer.slices?.[1]?.segments || [];
    
    // Helper function to create a segment with proper field names
    const createSegment = (segment: any, slice: any) => ({
      origin_airport: segment.origin?.iata_code || slice.origin?.iata_code,
      destination_airport: segment.destination?.iata_code || slice.destination?.iata_code,
      departure_at: segment.departing_at || segment.departure || 'TBD',
      arrival_at: segment.arriving_at || segment.arrival || 'TBD',
      duration: segment.duration || slice.duration,
    });

    // Log what we're using for the flight card
    console.log('Data being used for FlightCard:', {
      airline: offer.owner?.name || 'Unknown',
      price: Number(offer.total_amount),
      stops: outboundSegments.length > 0 ? outboundSegments.length - 1 : 0,
      cabin_class: offer.cabin_class || 'economy',
      outbound_segments_count: outboundSegments.length,
      return_segments_count: returnSegments.length
    });

    return {
      airline: offer.owner?.name || 'Unknown',
      price: Number(offer.total_amount),
      link: offer.id,
      stops: outboundSegments.length > 0 ? outboundSegments.length - 1 : 0,
      cabin_class: offer.cabin_class || 'economy',
      currency: offer.total_currency || 'USD',
      outbound_segments: outboundSegments.map((seg: any) => 
        createSegment(seg, offer.slices[0])
      ),
      return_segments: returnSegments.map((seg: any) => 
        createSegment(seg, offer.slices[1])
      ),
    };
  }

  // --- Helper function to build the results page link ---
  const buildResultsLink = useCallback((params: SearchParamsType | null): string => {
    if (!params) return '#';
    const query = new URLSearchParams({
        originAirport: params.originAirport,
        destinationAirport: params.destinationAirport,
        departureDate: params.departureDate,
        adults: params.adults.toString(),
        cabinClass: params.cabinClass || 'economy',
    });
    if (params.returnDate) {
        query.set('returnDate', params.returnDate);
    }
    return `/flights?${query.toString()}`;
  }, []);

  const handleSeeAllFlights = () => {
    if (!searchParams) return;
    const params = new URLSearchParams();
    if (searchParams.originAirport) params.append('originAirport', searchParams.originAirport);
    if (searchParams.destinationAirport) params.append('destinationAirport', searchParams.destinationAirport);
    if (searchParams.departureDate) params.append('departureDate', searchParams.departureDate);
    if (searchParams.returnDate) params.append('returnDate', searchParams.returnDate);
    if (searchParams.adults) params.append('adults', searchParams.adults.toString());
    if (searchParams.cabinClass) params.append('cabinClass', searchParams.cabinClass);
    router.push(`/flights?${params.toString()}`);
  };

  // --- Render Logic ---
  if (isLoading) {
      return (
        <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
            <div className="container mx-auto px-4 text-center">
                <div className="inline-flex items-center justify-center gap-2 text-gray-600">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-t-blue-600 border-gray-300"></div>
                    <span>Loading flight deals...</span>
                </div>
            </div>
        </section>
      );
  }

  if (error) {
      return (
          <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
              <div className="container mx-auto px-4">
                  <div className="text-center text-red-700 bg-red-100 p-4 rounded border border-red-300 max-w-md mx-auto">
                      <p className="font-semibold text-lg mb-1">Oops! Couldn't Load Flights</p>
                      <p className="text-sm">{error}</p>
                  </div>
              </div>
          </section>
      );
  }

  if (!searchParams) {
      return null;
  }

  if (flights.length === 0) {
      return (
          <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
              <div className="container mx-auto px-4">
                  <div className="text-center text-gray-600 py-10 bg-gray-50 rounded-lg max-w-lg mx-auto">
                      <p className="text-xl mb-2 font-medium">No flights found matching your criteria.</p>
                      <p className="text-sm">Consider adjusting your dates or airports in the search above.</p>
                  </div>
              </div>
          </section>
      );
  }

  const sortedFlights = Array.isArray(flights) ? [...flights].sort((a, b) => a.price - b.price) : [];
  const displayedFlights = showPagination ? sortedFlights : sortedFlights.slice(0, 3);
  const totalPages = Math.ceil(totalResults / 10);

  return (
    <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center md:text-left font-serif">
          {showPagination ? 'All Flight Deals' : 'Top Flight Deals Found'}
        </h2>
        <div className="space-y-4 max-w-4xl mx-auto">
          {Array.isArray(displayedFlights) && displayedFlights.length > 0 ? displayedFlights.map((flight, index) => (
            <FlightCard
              key={flight.link ? `${flight.link}-${index}` : `flight-home-${index}`}
              flight={flight}
            />
          )) : (
            <div className="text-center text-gray-600 py-10">No flights to display.</div>
          )}

          {/* "See More Results" Button */}
          {!showPagination && totalResults > 3 && (
            <div className="text-center pt-6">
              <button
                onClick={handleSeeAllFlights}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                See All {totalResults} Flights
                <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {showPagination && totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <button
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FlightResults;