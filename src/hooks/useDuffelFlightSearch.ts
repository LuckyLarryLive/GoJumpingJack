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
              setStatus('processing');
              break;
            case 'completed':
              setStatus('complete');
              if (job.results_data?.data) {
                console.log('[useDuffelFlightSearch] Setting offers:', {
                  count: job.results_data.data.length,
                  firstOffer: job.results_data.data[0] ? {
                    id: job.results_data.data[0].id,
                    total_amount: job.results_data.data[0].total_amount,
                    total_currency: job.results_data.data[0].total_currency,
                    slices: job.results_data.data[0].slices?.length
                  } : 'missing'
                });
                setOffers(job.results_data.data);
              } else {
                console.error('[useDuffelFlightSearch] No offers data in completed job:', {
                  jobId: job.id,
                  status: job.status,
                  hasResultsData: !!job.results_data,
                  resultsDataKeys: job.results_data ? Object.keys(job.results_data) : [],
                  rawResultsData: job.results_data
                });
                setError('No flight offers found');
                setStatus('error');
              }
              if (job.results_data?.meta) {
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
              setStatus('error');
              setError(job.error_message || 'Search failed');
              break;
          }
        }
      )
      .subscribe();

    return () => {
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