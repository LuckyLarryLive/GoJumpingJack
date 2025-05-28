// NOTE: This hook now uses the Supabase Edge Function for Duffel search jobs.
// The endpoint is set via NEXT_PUBLIC_DUFFEL_INITIATE_FUNCTION_URL and is PUBLIC (no auth required).
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: { adults: number; children?: number; infants?: number };
  cabinClass: string;
}

export function useDuffelFlightSearch() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'searching' | 'pending' | 'processing' | 'complete' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const duffelInitiateUrl = process.env.NEXT_PUBLIC_DUFFEL_INITIATE_FUNCTION_URL!;

  // Initiate search using Supabase client for proper authentication
  const initiateSearch = useCallback(async (params: FlightSearchParams) => {
    setStatus('searching');
    setError(null);
    setOffers([]);
    setMeta(null);
    setJobId(null);

    try {
      const { data, error: supabaseError } = await supabase.functions.invoke('initiate-duffel-search', {
        body: { searchParams: params }
      });

      if (supabaseError) throw new Error(supabaseError.message);
      if (!data) throw new Error('No data received from search initiation');

      setJobId(data.job_id);
      setStatus('pending');
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  // Subscribe to job updates
  useEffect(() => {
    if (!jobId) return;

    console.log('[useDuffelFlightSearch] Setting up subscription for job:', jobId);

    const channel = supabase
      .channel(`duffel_job_${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'duffel_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          console.log('[useDuffelFlightSearch] Raw payload received:', payload);
          
          const job = payload.new;
          console.log('[useDuffelFlightSearch] Received job update:', {
            jobId: job.id,
            status: job.status,
            hasResultsData: !!job.results_data,
            resultsDataKeys: job.results_data ? Object.keys(job.results_data) : [],
            resultsDataStructure: job.results_data ? {
              hasData: !!job.results_data.data,
              dataLength: job.results_data.data?.length,
              hasMeta: !!job.results_data.meta,
              metaKeys: job.results_data.meta ? Object.keys(job.results_data.meta) : []
            } : null,
            rawResultsData: job.results_data // Log the raw data for debugging
          });

          switch (job.status) {
            case 'processing':
              console.log('[useDuffelFlightSearch] Job is processing');
              setStatus('processing');
              break;
            case 'completed':
              console.log('[useDuffelFlightSearch] Job completed, processing results');
              setStatus('complete');
              
              // Check if results_data exists and is an object
              if (!job.results_data || typeof job.results_data !== 'object') {
                console.error('[useDuffelFlightSearch] Invalid results_data:', {
                  type: typeof job.results_data,
                  value: job.results_data
                });
                setError('Invalid results data received');
                setStatus('error');
                return;
              }

              // Check if data array exists
              if (!Array.isArray(job.results_data.data)) {
                console.error('[useDuffelFlightSearch] Invalid data array:', {
                  type: typeof job.results_data.data,
                  value: job.results_data.data
                });
                setError('Invalid offers data received');
                setStatus('error');
                return;
              }

              if (job.results_data.data.length > 0) {
                // Transform Duffel offers into Flight format
                const transformedOffers = job.results_data.data.map((offer: any) => {
                  const outboundSegments = offer.slices?.[0]?.segments || [];
                  const returnSegments = offer.slices?.[1]?.segments || [];
                  
                  // Helper function to create a segment with proper field names
                  const createSegment = (segment: any) => ({
                    origin_airport: segment.origin?.iata_code || '',
                    destination_airport: segment.destination?.iata_code || '',
                    departure_at: segment.departing_at || '',
                    arrival_at: segment.arriving_at || '',
                    duration: segment.duration || '',
                    airline: segment.operating_carrier?.name || segment.marketing_carrier?.name || '',
                    flight_number: segment.operating_carrier_flight_number || segment.marketing_carrier_flight_number || '',
                    aircraft: segment.aircraft || '',
                    cabin_class: segment.passengers?.[0]?.cabin_class || offer.cabin_class || 'economy'
                  });

                  return {
                    airline: offer.owner?.name || 'Unknown',
                    price: Number(offer.total_amount),
                    link: offer.id,
                    stops: outboundSegments.length > 0 ? outboundSegments.length - 1 : 0,
                    cabin_class: offer.cabin_class || 'economy',
                    currency: offer.total_currency || 'USD',
                    outbound_segments: outboundSegments.map(createSegment),
                    return_segments: returnSegments.map(createSegment),
                  };
                });

                console.log('[useDuffelFlightSearch] Setting transformed offers:', {
                  count: transformedOffers.length,
                  firstOffer: transformedOffers[0] ? {
                    airline: transformedOffers[0].airline,
                    price: transformedOffers[0].price,
                    stops: transformedOffers[0].stops,
                    outbound_segments: transformedOffers[0].outbound_segments.length,
                    return_segments: transformedOffers[0].return_segments.length
                  } : 'missing'
                });

                setOffers(transformedOffers);
              } else {
                console.warn('[useDuffelFlightSearch] No offers found in results');
                setError('No flight offers found');
                setStatus('error');
              }

              // Process meta data
              if (job.results_data.meta && typeof job.results_data.meta === 'object') {
                console.log('[useDuffelFlightSearch] Setting meta:', {
                  metaKeys: Object.keys(job.results_data.meta),
                  metaData: job.results_data.meta
                });
                setMeta(job.results_data.meta);
              } else {
                console.warn('[useDuffelFlightSearch] No meta data in completed job');
              }
              break;
            case 'failed':
              console.log('[useDuffelFlightSearch] Job failed:', job.error_message);
              setStatus('error');
              setError(job.error_message || 'Search failed');
              break;
            default:
              console.warn('[useDuffelFlightSearch] Unknown job status:', job.status);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('[useDuffelFlightSearch] Subscription status:', status);
      });

    return () => {
      console.log('[useDuffelFlightSearch] Cleaning up subscription for job:', jobId);
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  // Manual pagination/sort using Supabase client for proper authentication
  const fetchPage = useCallback(
    async (opts: { sort?: string; limit?: number; after?: string }) => {
      if (!jobId) return;

      try {
        const { data: job, error: jobError } = await supabase
          .from('duffel_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (jobError) throw jobError;

        const { data, error: supabaseError } = await supabase.functions.invoke('initiate-duffel-search', {
          body: {
            searchParams: {
              ...job.search_params,
              ...opts,
            },
          }
        });

        if (supabaseError) throw new Error(supabaseError.message);
        if (!data) throw new Error('No data received from search initiation');

        setJobId(data.job_id);
        setStatus('pending');
      } catch (err: any) {
        setError(err.message);
        setStatus('error');
      }
    },
    [jobId]
  );

  return {
    initiateSearch,
    offers,
    meta,
    status,
    error,
    fetchPage,
    jobId,
  };
} 