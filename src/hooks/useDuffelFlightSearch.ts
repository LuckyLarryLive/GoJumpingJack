// NOTE: This hook now uses the Supabase Edge Function for Duffel search jobs.
// The endpoint is set via NEXT_PUBLIC_DUFFEL_INITIATE_FUNCTION_URL.
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const duffelInitiateUrl = process.env.NEXT_PUBLIC_DUFFEL_INITIATE_FUNCTION_URL!;

  // Initiate search
  const initiateSearch = useCallback(async (params: FlightSearchParams) => {
    setStatus('searching');
    setError(null);
    setOffers([]);
    setMeta(null);
    setJobId(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const res = await fetch(duffelInitiateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ searchParams: params }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate search');

      setJobId(data.job_id);
      setStatus('pending');
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  }, [supabase, duffelInitiateUrl]);

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
          switch (job.status) {
            case 'processing':
              setStatus('processing');
              break;
            case 'completed':
              setStatus('complete');
              setOffers(job.results_data.data);
              setMeta(job.results_data.meta);
              break;
            case 'failed':
              setStatus('error');
              setError(job.error_message);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, supabase]);

  // Manual pagination/sort
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

        // Create a new job for the paginated results
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const res = await fetch(duffelInitiateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            searchParams: {
              ...job.search_params,
              ...opts,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch page');

        setJobId(data.job_id);
        setStatus('pending');
      } catch (err: any) {
        setError(err.message);
        setStatus('error');
      }
    },
    [jobId, supabase, duffelInitiateUrl]
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