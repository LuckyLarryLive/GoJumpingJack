import { useState, useEffect, useRef, useCallback } from 'react';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: { adults: number; children?: number; infants?: number };
  cabinClass: string;
}

export function useDuffelFlightSearch() {
  const [offerRequestId, setOfferRequestId] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'searching' | 'pending' | 'complete' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Initiate search
  const initiateSearch = useCallback(async (params: FlightSearchParams) => {
    setStatus('searching');
    setError(null);
    setOffers([]);
    setMeta(null);
    setOfferRequestId(null);
    try {
      const res = await fetch('/api/flights/initiate-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to initiate search');
      setOfferRequestId(data.offer_request_id);
      setStatus('pending');
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  // Poll for results
  const pollResults = useCallback(
    async (id: string, opts: { sort?: string; limit?: number; after?: string } = {}) => {
      try {
        const params = new URLSearchParams({ offer_request_id: id });
        if (opts.sort) params.append('sort', opts.sort);
        if (opts.limit) params.append('limit', String(opts.limit));
        if (opts.after) params.append('after', opts.after);
        const res = await fetch(`/api/flights/results?${params.toString()}`);
        const data = await res.json();
        if (data.status === 'pending') {
          setStatus('pending');
          setOffers([]);
          setMeta(data.meta);
        } else if (data.status === 'complete') {
          setStatus('complete');
          setOffers(data.offers);
          setMeta(data.meta);
        } else {
          setStatus('error');
          setError(data.message || 'Unknown error');
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message);
      }
    },
    []
  );

  // Polling effect
  useEffect(() => {
    if (!offerRequestId || status === 'complete' || status === 'error') {
      if (pollRef.current) clearTimeout(pollRef.current);
      return;
    }
    pollResults(offerRequestId);
    pollRef.current = setTimeout(() => pollResults(offerRequestId), 2500);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line
  }, [offerRequestId, status]);

  // Manual pagination/sort
  const fetchPage = useCallback(
    (opts: { sort?: string; limit?: number; after?: string }) => {
      if (offerRequestId) pollResults(offerRequestId, opts);
    },
    [offerRequestId, pollResults]
  );

  return {
    initiateSearch,
    offers,
    meta,
    status,
    error,
    fetchPage,
    offerRequestId,
  };
} 