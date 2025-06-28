'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DuffelOffer, DuffelSeatMap, SelectedSeat, SeatMapResponse } from '@/types/duffel';
import { FaTimes, FaSpinner, FaInfoCircle } from 'react-icons/fa';

interface SeatMapModalProps {
  offerId: string;
  offer: DuffelOffer;
  selectedSeats: SelectedSeat[];
  onClose: () => void;
  onSeatsSelected: (seats: SelectedSeat[]) => void;
}

const SeatMapModal: React.FC<SeatMapModalProps> = ({
  offerId,
  offer,
  selectedSeats,
  onClose,
  onSeatsSelected,
}) => {
  const [seatMaps, setSeatMaps] = useState<DuffelSeatMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [tempSelectedSeats, setTempSelectedSeats] = useState<SelectedSeat[]>(selectedSeats);

  const fetchSeatMaps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/flights/offers/${offerId}/seat_map`);
      const data: SeatMapResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch seat maps');
      }

      setAvailable(data.available);
      setSeatMaps(data.data || []);

      if (!data.available) {
        setError(
          data.error ||
            'Online seat selection is not available for this airline. Seats will be assigned during check-in.'
        );
      }
    } catch (err: unknown) {
      console.error('Error fetching seat maps:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load seat maps';
      setError(errorMessage);
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    fetchSeatMaps();
  }, [fetchSeatMaps]);

  const handleSeatClick = (
    seatMap: DuffelSeatMap,
    seatElement: {
      id?: string;
      available?: boolean;
      type: string;
      designator?: string;
      services?: { id: string; total_amount: string; total_currency: string }[];
    },
    rowIndex: number,
    sectionIndex: number,
    elementIndex: number
  ) => {
    if (!seatElement.available || seatElement.type !== 'seat') return;

    const seatId = seatElement.id;
    const designator =
      seatElement.designator || `${rowIndex + 1}${String.fromCharCode(65 + elementIndex)}`;

    // Check if seat is already selected
    const existingIndex = tempSelectedSeats.findIndex(s => s.seatId === seatId);

    if (existingIndex >= 0) {
      // Remove seat selection
      setTempSelectedSeats(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // Add seat selection (for now, we'll assume one passenger)
      const newSeat: SelectedSeat = {
        passengerId: 'passenger_1', // This should come from the offer's passenger data
        seatId,
        segmentId: seatMap.segment_id,
        sliceId: seatMap.slice_id,
        designator,
        serviceId: seatElement.services?.[0]?.id || undefined,
        price: seatElement.services?.[0]
          ? {
              amount: seatElement.services[0].total_amount,
              currency: seatElement.services[0].total_currency,
            }
          : undefined,
      };

      setTempSelectedSeats(prev => [...prev, newSeat]);
    }
  };

  const handleConfirmSelection = () => {
    onSeatsSelected(tempSelectedSeats);
  };

  const getSeatClass = (seatElement: {
    type: string;
    available?: boolean;
    id?: string;
    services?: unknown[];
  }) => {
    const baseClass =
      'w-8 h-8 m-1 rounded border text-xs flex items-center justify-center cursor-pointer transition-colors';

    if (seatElement.type !== 'seat') {
      return baseClass + ' bg-gray-100 border-gray-300 cursor-not-allowed';
    }

    if (!seatElement.available) {
      return baseClass + ' bg-red-100 border-red-300 text-red-600 cursor-not-allowed';
    }

    const isSelected = tempSelectedSeats.some(s => s.seatId === seatElement.id);
    if (isSelected) {
      return baseClass + ' bg-blue-500 border-blue-600 text-white';
    }

    const hasPrice = seatElement.services && seatElement.services.length > 0;
    if (hasPrice) {
      return baseClass + ' bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200';
    }

    return baseClass + ' bg-green-100 border-green-300 text-green-800 hover:bg-green-200';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading seat map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Select Your Seats</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && !available ? (
            <div className="text-center py-8">
              <FaInfoCircle className="text-4xl text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Seat Selection Not Available
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">{error}</p>
            </div>
          ) : available && seatMaps.length > 0 ? (
            <div className="space-y-8">
              {/* Legend */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3">Seat Legend</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
                    <span>Available (Free)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
                    <span>Available (Extra Fee)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded mr-2"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
                    <span>Occupied</span>
                  </div>
                </div>
              </div>

              {/* Seat Maps */}
              {seatMaps.map((seatMap, mapIndex) => (
                <div key={seatMap.id} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">
                    Segment {mapIndex + 1}:{' '}
                    {
                      offer.slices
                        .find(s => s.id === seatMap.slice_id)
                        ?.segments.find(seg => seg.id === seatMap.segment_id)?.marketing_carrier
                        .name
                    }
                  </h3>

                  {seatMap.cabins.map((cabin, cabinIndex) => (
                    <div key={cabinIndex} className="mb-6">
                      <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
                        {cabin.rows.map((row, rowIndex) => (
                          <div key={rowIndex} className="flex items-center justify-center mb-2">
                            <div className="w-8 text-center text-xs text-gray-500 mr-2">
                              {rowIndex + 1}
                            </div>
                            {row.sections.map((section, sectionIndex) => (
                              <div key={sectionIndex} className="flex">
                                {section.elements.map((element, elementIndex) => (
                                  <div
                                    key={elementIndex}
                                    className={getSeatClass(element)}
                                    onClick={() =>
                                      handleSeatClick(
                                        seatMap,
                                        element,
                                        rowIndex,
                                        sectionIndex,
                                        elementIndex
                                      )
                                    }
                                    title={
                                      element.designator ||
                                      `${rowIndex + 1}${String.fromCharCode(65 + elementIndex)}`
                                    }
                                  >
                                    {element.type === 'seat'
                                      ? element.designator?.slice(-1) ||
                                        String.fromCharCode(65 + elementIndex)
                                      : element.type === 'empty'
                                        ? ''
                                        : '×'}
                                  </div>
                                ))}
                                {sectionIndex < row.sections.length - 1 && (
                                  <div className="w-4"></div> // Aisle space
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No seat maps available for this flight.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {available && seatMaps.length > 0 && (
          <div className="border-t p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{tempSelectedSeats.length} seat(s) selected</p>
                {tempSelectedSeats.some(s => s.price) && (
                  <p className="text-sm text-gray-600">Additional fees may apply</p>
                )}
              </div>
              <div className="space-x-3">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSelection}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatMapModal;
