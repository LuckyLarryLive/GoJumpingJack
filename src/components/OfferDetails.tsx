'use client';

import React from 'react';
import Image from 'next/image';
import { DuffelOffer, SelectedSeat } from '@/types/duffel';
import { FaPlane, FaClock, FaSuitcase, FaInfoCircle } from 'react-icons/fa';

interface OfferDetailsProps {
  offer: DuffelOffer;
  selectedSeats: SelectedSeat[];
  onSeatSelection: () => void;
  seatMapLoading: boolean;
}

const OfferDetails: React.FC<OfferDetailsProps> = ({
  offer,
  // selectedSeats,
  // onSeatSelection,
  // seatMapLoading,
}) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (duration: string) => {
    // Duration is in ISO 8601 format (PT2H30M)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return duration;

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const calculateLayover = (arrivalTime: string, departureTime: string) => {
    const arrival = new Date(arrivalTime);
    const departure = new Date(departureTime);
    const diffMs = departure.getTime() - arrival.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours === 0) return `${diffMinutes}m`;
    return `${diffHours}h ${diffMinutes}m`;
  };

  const getBaggageAllowance = () => {
    const carryOn: string[] = [];
    const checked: string[] = [];

    if (Array.isArray(offer.passengers)) {
      offer.passengers.forEach(passenger => {
        if (Array.isArray(passenger.baggages)) {
          passenger.baggages.forEach(baggage => {
        let description =
          baggage.quantity > 0
            ? `${baggage.quantity} ${baggage.type.replace('_', ' ')} bag${baggage.quantity > 1 ? 's' : ''}`
            : `No ${baggage.type.replace('_', ' ')} bags`;

        if (baggage.weight_value) {
          description += ` (${baggage.weight_value}${baggage.weight_unit || 'kg'} each)`;
        }

        if (baggage.type === 'carry_on') {
          carryOn.push(description);
        } else if (baggage.type === 'checked') {
          checked.push(description);
        }
          });
        }
      });
    }

    return {
      carryOn: [...new Set(carryOn)],
      checked: [...new Set(checked)],
    };
  };

  const baggage = getBaggageAllowance();

  return (
    <div className="space-y-6">
      {/* Price Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {offer.total_currency} {offer.total_amount}
            </h2>
            <p className="text-gray-600">Total Price</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Operated by</p>
            <div className="flex items-center">
              {offer.owner.logo_symbol_url && (
                <Image
                  src={offer.owner.logo_symbol_url}
                  alt={offer.owner.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 mr-2"
                />
              )}
              <span className="font-medium">{offer.owner.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Itinerary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Flight Itinerary</h3>

        {offer.slices.map((slice, sliceIndex) => (
          <div key={slice.id} className="mb-6 last:mb-0">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                {sliceIndex === 0 ? 'Outbound' : 'Return'} Flight
              </h4>
              <div className="text-sm text-gray-600">
                {formatDate(slice.departing_at)} • {formatDuration(slice.duration)}
              </div>
            </div>

            {slice.segments.map((segment, segmentIndex) => (
              <div key={segment.id}>
                {/* Segment Details */}
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {segment.marketing_carrier.logo_symbol_url && (
                        <Image
                          src={segment.marketing_carrier.logo_symbol_url}
                          alt={segment.marketing_carrier.name}
                          width={24}
                          height={24}
                          className="w-6 h-6 mr-2"
                        />
                      )}
                      <span className="font-medium">
                        {segment.marketing_carrier.name} {segment.marketing_carrier_flight_number}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">{segment.aircraft.name}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Departure */}
                    <div>
                      <div className="text-lg font-semibold">
                        {formatTime(segment.departing_at)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {segment.origin.name} ({segment.origin.iata_code})
                      </div>
                      <div className="text-sm text-gray-500">
                        {segment.origin.city.name}
                        {segment.origin_terminal && ` • Terminal ${segment.origin_terminal}`}
                      </div>
                    </div>

                    {/* Flight Duration */}
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <FaPlane className="mx-2 text-gray-400" />
                        <div className="h-px bg-gray-300 flex-1"></div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDuration(segment.duration)}
                      </div>
                    </div>

                    {/* Arrival */}
                    <div className="text-right">
                      <div className="text-lg font-semibold">{formatTime(segment.arriving_at)}</div>
                      <div className="text-sm text-gray-600">
                        {segment.destination.name} ({segment.destination.iata_code})
                      </div>
                      <div className="text-sm text-gray-500">
                        {segment.destination.city.name}
                        {segment.destination_terminal &&
                          ` • Terminal ${segment.destination_terminal}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layover Information */}
                {segmentIndex < slice.segments.length - 1 && (
                  <div className="flex items-center justify-center py-2 mb-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                      <div className="flex items-center text-yellow-800">
                        <FaClock className="mr-2" />
                        <span className="text-sm">
                          Layover:{' '}
                          {calculateLayover(
                            segment.arriving_at,
                            slice.segments[segmentIndex + 1].departing_at
                          )}{' '}
                          in {segment.destination.city.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Baggage Allowance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <FaSuitcase className="mr-2" />
          Baggage Allowance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Carry-on Bags</h4>
            {baggage.carryOn.length > 0 ? (
              <ul className="text-sm text-gray-600 space-y-1">
                {baggage.carryOn.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No carry-on bags included</p>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Checked Bags</h4>
            {baggage.checked.length > 0 ? (
              <ul className="text-sm text-gray-600 space-y-1">
                {baggage.checked.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No checked bags included</p>
            )}
          </div>
        </div>
      </div>

      {/* Fare Conditions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <FaInfoCircle className="mr-2" />
          Fare Conditions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Changes</h4>
            {offer.conditions.change_before_departure ? (
              <div className="text-sm">
                <p
                  className={
                    offer.conditions.change_before_departure.allowed
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {offer.conditions.change_before_departure.allowed
                    ? '✓ Changes allowed'
                    : '✗ Changes not allowed'}
                </p>
                {offer.conditions.change_before_departure.penalty_amount && (
                  <p className="text-gray-600">
                    Fee: {offer.conditions.change_before_departure.penalty_currency}{' '}
                    {offer.conditions.change_before_departure.penalty_amount}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No change information available</p>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Refunds</h4>
            {offer.conditions.refund_before_departure ? (
              <div className="text-sm">
                <p
                  className={
                    offer.conditions.refund_before_departure.allowed
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {offer.conditions.refund_before_departure.allowed
                    ? '✓ Refunds allowed'
                    : '✗ Non-refundable'}
                </p>
                {offer.conditions.refund_before_departure.penalty_amount && (
                  <p className="text-gray-600">
                    Fee: {offer.conditions.refund_before_departure.penalty_currency}{' '}
                    {offer.conditions.refund_before_departure.penalty_amount}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No refund information available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferDetails;
