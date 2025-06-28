'use client'; // Required for useState, useEffect

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SearchParamsType } from '@/types'; // Import shared types
import type { FlightSearchParams } from '@/hooks/useDuffelFlightSearch';
import FlightCard from './FlightCard'; // <--- ADD BACK FlightCard Import
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// --- Component Props Interface ---
interface FlightResultsProps {
  searchParams: SearchParamsType[];
  showPagination?: boolean;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  filterFlights?: (flights: unknown[]) => unknown[];
  sortBy?: string; // Add sortBy prop
}

const JACK_VIDEO_PATH = '/Jack_Finding_Flights.mp4';

// --- Flight Results Component ---
const FlightResults: React.FC<FlightResultsProps> = ({
  searchParams,
  showPagination = false,
  onPageChange,
  currentPage = 1,
  filterFlights,
  sortBy = 'price', // Default to price sorting
}) => {
  const router = useRouter();
  const [allOffers, setAllOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // --- Loading phrases state ---
  const [phrases, setPhrases] = useState<string[]>([]);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef(0);

  // Fetch loading phrases from Supabase on mount
  useEffect(() => {
    async function fetchPhrases() {
      const { data, error } = await supabase.from('loading_phrases').select('phrase');
      console.log('[FlightResults] loading_phrases data:', data, 'error:', error);
      if (error || !data || data.length === 0) {
        setPhrases(['Finding the best flights...', 'Jack is searching for deals...']);
        setPhraseIndex(Math.floor(Math.random() * 2));
      } else {
        setPhrases(data.map((row: any) => row.phrase));
        // Set a random initial phrase index
        const max = data.length;
        setPhraseIndex(Math.floor(Math.random() * max));
      }
    }
    fetchPhrases();
  }, []);

  // Handler for when the video loops (using onTimeUpdate)
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || phrases.length === 0) return;
    const currentTime = video.currentTime;
    if (currentTime < lastTimeRef.current) {
      // Video looped
      let nextIndex = phraseIndex;
      let tries = 0;
      while (phrases.length > 1 && nextIndex === phraseIndex && tries < 10) {
        nextIndex = Math.floor(Math.random() * phrases.length);
        tries++;
      }
      setPhraseIndex(nextIndex);
    }
    lastTimeRef.current = currentTime;
  };

  // Helper: Filter valid flights (not partial, has outbound segments)
  // function filterValidFlights(flights: unknown[]): unknown[] {
  //   return flights.filter(
  //     flight =>
  //       !flight.partial &&
  //       Array.isArray(flight.outbound_segments) &&
  //       flight.outbound_segments.length > 0
  //   );
  // }

  // Helper: Adjust date by days
  // function adjustDate(dateStr: string, days: number): string {
  //   const date = new Date(dateStr);
  //   date.setDate(date.getDate() + days);
  //   return date.toISOString().split('T')[0];
  // }

  // Helper: Get all cabin classes
  // const CABIN_CLASSES = ['economy', 'premium_economy', 'business', 'first'];

  // Helper: Try city search (if not already city)
  // function isAirportCode(code: string) {
  //   return code && code.length === 3 && code.toUpperCase() === code;
  // }

  // Helper to map SearchParamsType to FlightSearchParams
  function toFlightSearchParams(params: SearchParamsType): FlightSearchParams {
    return {
      origin: params.originAirport,
      destination: params.destinationAirport,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      passengers: {
        adults: params.adults,
        children: params.children,
        infants: params.infants,
      },
      cabinClass: params.cabinClass || 'economy',
    };
  }

  // Helper to subscribe to a job's results
  function subscribeToJob(jobId: string, onOffers: (offers: any[]) => void) {
    const channelName = `duffel_job_${jobId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'duffel_jobs',
          filter: `id=eq.${jobId}`,
        },
        payload => {
          if (payload?.new?.results_data?.data) {
            onOffers(payload.new.results_data.data);
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }

  // Helper: Get the most common or lowest cabin class from all segments
  function deriveCabinClass(slices: any[]): string {
    const allCabins: string[] = [];
    if (Array.isArray(slices)) {
      slices.forEach(slice => {
        if (Array.isArray(slice?.segments)) {
          slice.segments.forEach((segment: any) => {
            if (Array.isArray(segment?.passengers) && segment.passengers[0]?.cabin_class) {
              allCabins.push(segment.passengers[0].cabin_class);
            }
          });
        }
      });
    }
    if (allCabins.length === 0) return 'unknown';
    const uniqueCabins = Array.from(new Set(allCabins));
    if (uniqueCabins.length === 1) return uniqueCabins[0];
    // Optionally, sort by class hierarchy if you want the lowest
    const hierarchy = ['economy', 'premium_economy', 'business', 'first'];
    const sorted = uniqueCabins.sort((a, b) => hierarchy.indexOf(a) - hierarchy.indexOf(b));
    return 'mixed (' + sorted.join(', ') + ')';
  }

  // Helper: Transform Duffel offer to Flight shape
  function duffelOfferToFlight(offer: any): Flight | null {
    try {
      // Defensive: check for required fields
      if (!offer?.slices?.[0]?.segments?.[0]) {
        console.warn('Skipping offer with missing segments:', offer);
        return null;
      }

      const outboundSegments = offer.slices[0].segments || [];
      const returnSegments = offer.slices[1]?.segments || [];
      const flightCabinClass = deriveCabinClass(offer.slices || []);

      // Helper function to create a segment with proper field names
      const createSegment = (segment: any, slice: any) => ({
        origin_airport: segment.origin?.iata_code || '',
        destination_airport: segment.destination?.iata_code || '',
        departure_at: segment.departing_at || '',
        arrival_at: segment.arriving_at || '',
        duration: segment.duration || '',
        airline: segment.operating_carrier?.name || segment.marketing_carrier?.name || '',
        flight_number:
          segment.operating_carrier_flight_number || segment.marketing_carrier_flight_number || '',
        aircraft: segment.aircraft || '',
        cabin_class: segment.passengers?.[0]?.cabin_class || offer.cabin_class || 'economy',
      });

      return {
        airline: offer.owner?.name || 'Unknown',
        price: Number(offer.total_amount),
        link: offer.id,
        stops: outboundSegments.length > 0 ? outboundSegments.length - 1 : 0,
        cabin_class: flightCabinClass,
        currency: offer.total_currency || 'USD',
        outbound_segments: outboundSegments.map((seg: any) => createSegment(seg, offer.slices[0])),
        return_segments: returnSegments.map((seg: any) => createSegment(seg, offer.slices[1])),
      };
    } catch (err) {
      console.error('Error transforming Duffel offer:', err);
      return null;
    }
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
    if (!searchParams || searchParams.length === 0) return;
    // Serialize all searchParams as JSON and encode
    const allParams = encodeURIComponent(JSON.stringify(searchParams));
    router.push(`/flights?allSearchParams=${allParams}`);
  };

  // Helper function to calculate total duration in minutes
  const calculateTotalDuration = (flight: any) => {
    if (!Array.isArray(flight.outbound_segments) || !flight.outbound_segments.length) return 0;
    const firstSegment = flight.outbound_segments[0];
    const lastSegment = flight.outbound_segments[flight.outbound_segments.length - 1];
    const start = new Date(firstSegment?.departure_at);
    const end = new Date(lastSegment?.arrival_at);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    return end.getTime() - start.getTime();
  };

  // Filtering, sorting, and pagination logic (client-side)
  let sortedFlights = Array.isArray(allOffers) ? [...allOffers] : [];

  // Apply sorting based on sortBy value
  sortedFlights.sort((a, b) => {
    switch (sortBy) {
      case 'duration':
        return calculateTotalDuration(a) - calculateTotalDuration(b);
      case 'departure':
        const aTime = new Date(a.outbound_segments[0]?.departure_at).getTime();
        const bTime = new Date(b.outbound_segments[0]?.departure_at).getTime();
        return aTime - bTime;
      case 'price':
      default:
        return a.price - b.price;
    }
  });

  if (filterFlights) sortedFlights = filterFlights(sortedFlights);
  const displayedFlights = showPagination ? sortedFlights : sortedFlights.slice(0, 3);
  const totalResults = sortedFlights.length;
  const totalPages = Math.ceil(totalResults / 10);
  console.log(
    '[FlightResults] searchParams.length:',
    searchParams.length,
    'allOffers.length:',
    allOffers.length,
    'displayedFlights.length:',
    displayedFlights.length,
    'showPagination:',
    showPagination
  );

  // Helper to summarize origins/destinations for display
  function getSummaryString() {
    if (!searchParams || searchParams.length === 0) return '';
    const first = searchParams[0];
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
      new Set(Array.isArray(searchParams) ? (searchParams as SearchParamsType[]).map(p => p.departureDate) : [])
    );
    const returnDates = Array.from(
      new Set(Array.isArray(searchParams) ? (searchParams as SearchParamsType[]).map(p => p.returnDate).filter(Boolean) : [])
    );
    return `Flights from ${originLabel} to ${destinationLabel}${departureDates.length === 1 ? ' on ' + departureDates[0] : ''}${returnDates.length === 1 ? ' (Return: ' + returnDates[0] + ')' : ''}`;
  }

  useEffect(() => {
    if (!Array.isArray(searchParams) || searchParams.length === 0) return;
    setLoading(true);
    setError(null);
    setAllOffers([]);
    let isCancelled = false;
    let unsubscribers: (() => void)[] = [];
    const allOffersMap = new Map();
    let completedJobs = 0;
    const totalJobs = searchParams.length;

    // Increase timeout to 60 seconds for multiple airport searches
    const safetyTimeout = setTimeout(() => {
      if (isCancelled) return;
      setLoading(false);
      if (allOffersMap.size === 0) {
        setError('Search timed out. Please try again with fewer airports or different dates.');
      } else {
        console.warn('Search partially completed - some results may be missing');
      }
    }, 60000);

    (async () => {
      try {
        await Promise.all(
          (Array.isArray(searchParams) ? searchParams : []).map(async params => {
            try {
              if (isCancelled) return;

              const flightParams = toFlightSearchParams(params);
              // Call initiateSearch and get jobId
              const { data, error } = await supabase.functions.invoke('initiate-duffel-search', {
                body: { searchParams: flightParams },
              });

              if (error) {
                console.error('Error initiating search:', error);
                completedJobs++;
                if (completedJobs === totalJobs) {
                  clearTimeout(safetyTimeout);
                  setLoading(false);
                  if (allOffersMap.size === 0) {
                    setError('Failed to search for flights. Please try again.');
                  }
                }
                return;
              }

              if (!data?.job_id) {
                console.error('No job ID returned from search');
                completedJobs++;
                if (completedJobs === totalJobs) {
                  clearTimeout(safetyTimeout);
                  setLoading(false);
                  if (allOffersMap.size === 0) {
                    setError('Failed to start flight search. Please try again.');
                  }
                }
                return;
              }

              const jobId = data.job_id;
              // Subscribe to this job's results
              const unsubscribe = subscribeToJob(jobId, offers => {
                if (isCancelled) return;
                for (const offer of offers) {
                  const transformedFlight = duffelOfferToFlight(offer);
                  if (transformedFlight) {
                    allOffersMap.set(offer.id, transformedFlight);
                  }
                }
                setAllOffers(Array.from(allOffersMap.values()));
                console.log(
                  '[FlightResults] setAllOffers called. allOffersMap size:',
                  allOffersMap.size
                );
                completedJobs++;
                if (completedJobs === totalJobs) {
                  clearTimeout(safetyTimeout);
                  setLoading(false);
                }
              });
              unsubscribers.push(unsubscribe);
            } catch (err: any) {
              if (err?.response?.status === 400) {
                console.error('400 Bad Request:', err);
                setError(
                  'There was a problem with your search. Please check your airport selections and try again.'
                );
              } else {
                console.error('Error fetching flight results:', err);
              }
              completedJobs++;
              if (completedJobs >= totalJobs && !isCancelled) {
                setLoading(false);
              }
            }
          })
        );
      } catch (err) {
        console.error('Unexpected error in fetchAll:', err);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
      clearTimeout(safetyTimeout);
      if (Array.isArray(unsubscribers)) {
        unsubscribers.forEach(unsub => unsub());
      }
    };
  }, [searchParams]);

  // Render logic (reuse existing error/loading/empty states)
  if (loading) {
    return (
      <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
        <div className="container mx-auto px-4 text-center flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            src={JACK_VIDEO_PATH}
            width={640}
            height={360}
            autoPlay
            loop
            muted
            playsInline
            onTimeUpdate={handleVideoTimeUpdate}
            className="rounded-lg shadow-lg mb-4"
            style={{ maxWidth: 800 }}
          />
          <div className="text-lg font-semibold text-blue-700 min-h-[2.5rem]">
            {phrases.length > 0 ? phrases[phraseIndex] : 'Finding the best flights...'}
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
  if (allOffers.length === 0) {
    return (
      <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600 py-10 bg-gray-50 rounded-lg max-w-lg mx-auto">
            <p className="text-xl mb-2 font-medium">No flights found matching your criteria.</p>
            <p className="text-sm">
              Consider adjusting your dates or airports in the search above.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="flight-results" className="py-8 md:py-12 bg-white scroll-mt-24">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center md:text-left font-serif">
          {showPagination ? 'All Flight Deals' : 'Top Flight Deals Found'}
        </h2>
        <div className="space-y-4 max-w-4xl mx-auto">
          {Array.isArray(displayedFlights) && displayedFlights.length > 0 ? (
            displayedFlights.map((flight, index) => (
              <FlightCard
                key={flight.link ? `${flight.link}-${index}` : `flight-home-${index}`}
                flight={flight}
              />
            ))
          ) : (
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
                <svg
                  className="ml-2 -mr-1 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
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
