'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DuffelOffer, OfferDetailsResponse, SelectedSeat } from '@/types/duffel';
import OfferDetails from '@/components/OfferDetails';
import SeatMapModal from '@/components/SeatMapModal';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';

export default function OfferDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.offer_id as string;

  const [offer, setOffer] = useState<DuffelOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [seatMapLoading, setSeatMapLoading] = useState(false);

  useEffect(() => {
    if (!offerId) {
      setError('Invalid offer ID');
      setLoading(false);
      return;
    }

    fetchOfferDetails();
  }, [offerId, fetchOfferDetails]);

  const fetchOfferDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/flights/offers/${offerId}`);
      const data: OfferDetailsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch offer details');
      }

      if (!data.data) {
        throw new Error('No offer data received');
      }

      setOffer(data.data);
    } catch (err: unknown) {
      console.error('Error fetching offer details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load offer details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  const handleSeatSelection = async () => {
    if (!offer) return;

    try {
      setSeatMapLoading(true);
      setShowSeatMap(true);
    } catch (err: unknown) {
      console.error('Error opening seat selection:', err);
      // We'll handle the actual seat map loading in the modal
    } finally {
      setSeatMapLoading(false);
    }
  };

  const handleSeatMapClose = () => {
    setShowSeatMap(false);
  };

  const handleSeatsSelected = (seats: SelectedSeat[]) => {
    setSelectedSeats(seats);
    setShowSeatMap(false);
  };

  const handleProceedToPurchase = () => {
    // TODO: Implement order creation flow
    console.log('Proceeding to purchase with offer:', offerId);
    console.log('Selected seats:', selectedSeats);

    // For now, show an alert
    alert('Order creation flow will be implemented in the next phase. Offer ID: ' + offerId);
  };

  const handleBackToResults = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading flight details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Unable to Load Flight Details
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={handleBackToResults}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Search Results
              </button>
              <button
                onClick={fetchOfferDetails}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No offer data available</p>
          <button
            onClick={handleBackToResults}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Search Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBackToResults}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Search Results
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Flight Details</h1>
        </div>

        {/* Offer Details */}
        <OfferDetails
          offer={offer}
          selectedSeats={selectedSeats}
          onSeatSelection={handleSeatSelection}
          seatMapLoading={seatMapLoading}
        />

        {/* Action Buttons */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSeatSelection}
              disabled={seatMapLoading}
              className="flex-1 bg-blue-100 text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {seatMapLoading ? (
                <>
                  <FaSpinner className="animate-spin inline mr-2" />
                  Loading Seat Map...
                </>
              ) : (
                'Select Seats'
              )}
            </button>
            <button
              onClick={handleProceedToPurchase}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Proceed to Purchase
            </button>
          </div>
          {selectedSeats.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">{selectedSeats.length} seat(s) selected</p>
          )}
        </div>
      </div>

      {/* Seat Map Modal */}
      {showSeatMap && (
        <SeatMapModal
          offerId={offerId}
          offer={offer}
          selectedSeats={selectedSeats}
          onClose={handleSeatMapClose}
          onSeatsSelected={handleSeatsSelected}
        />
      )}
    </div>
  );
}
