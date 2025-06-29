'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { DuffelOffer, SelectedSeat } from '@/types/duffel';
import {
  FaPlane,
  FaClock,
  FaSuitcase,
  FaInfoCircle,
  FaCode,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatPrice } from '@/lib/currency';
import { formatFlightDate, formatExpirationTime, getTimeUntilExpiration } from '@/lib/dateUtils';
import {
  convertCurrency,
  formatConvertedCurrency,
  getFallbackCurrencyDisplay,
} from '@/lib/currencyConversion';
import { processBaggageForAllSlices } from '@/lib/baggageUtils';
import { processAmenities, getAmenitiesIcons } from '@/lib/amenitiesUtils';
import RawDetailsModal from './RawDetailsModal';

interface OfferDetailsProps {
  offer: DuffelOffer;
  selectedSeats: SelectedSeat[];
  onSeatSelection: () => void;
  seatMapLoading: boolean;
}

interface ConvertedPenalty {
  originalAmount: string;
  originalCurrency: string;
  convertedAmount?: string;
  convertedCurrency?: string;
  displayText: string;
}

const OfferDetails: React.FC<OfferDetailsProps> = ({
  offer,
  // selectedSeats,
  // onSeatSelection,
  // seatMapLoading,
}) => {
  const { currency } = useCurrency();
  const [showRawDetails, setShowRawDetails] = useState(false);
  const [expirationInfo, setExpirationInfo] = useState<{
    expired: boolean;
    formatted?: string;
  }>({ expired: false });
  const [convertedPenalties, setConvertedPenalties] = useState<{
    refund?: ConvertedPenalty;
    change?: ConvertedPenalty;
  }>({});
  const [convertedTotalPrice, setConvertedTotalPrice] = useState<string>('');

  // Convert total price if different currency
  useEffect(() => {
    const convertTotalPrice = async () => {
      if (offer.total_currency !== currency) {
        const conversion = await convertCurrency(
          offer.total_amount,
          offer.total_currency,
          currency
        );

        if (conversion) {
          setConvertedTotalPrice(formatConvertedCurrency(conversion, false));
        } else {
          setConvertedTotalPrice(
            getFallbackCurrencyDisplay(offer.total_amount, offer.total_currency)
          );
        }
      } else {
        setConvertedTotalPrice('');
      }
    };

    convertTotalPrice();
  }, [offer.total_amount, offer.total_currency, currency]);

  // Convert penalty currencies
  useEffect(() => {
    const convertPenalties = async () => {
      const newConvertedPenalties: typeof convertedPenalties = {};

      // Convert refund penalty if exists and different currency
      if (
        offer.conditions.refund_before_departure?.penalty_amount &&
        offer.conditions.refund_before_departure?.penalty_currency &&
        offer.conditions.refund_before_departure.penalty_currency !== currency
      ) {
        const conversion = await convertCurrency(
          offer.conditions.refund_before_departure.penalty_amount,
          offer.conditions.refund_before_departure.penalty_currency,
          currency
        );

        if (conversion) {
          newConvertedPenalties.refund = {
            originalAmount: conversion.originalAmount,
            originalCurrency: conversion.originalCurrency,
            convertedAmount: conversion.convertedAmount,
            convertedCurrency: conversion.convertedCurrency,
            displayText: formatConvertedCurrency(conversion, true),
          };
        } else {
          newConvertedPenalties.refund = {
            originalAmount: offer.conditions.refund_before_departure.penalty_amount,
            originalCurrency: offer.conditions.refund_before_departure.penalty_currency,
            displayText: getFallbackCurrencyDisplay(
              offer.conditions.refund_before_departure.penalty_amount,
              offer.conditions.refund_before_departure.penalty_currency
            ),
          };
        }
      }

      // Convert change penalty if exists and different currency
      if (
        offer.conditions.change_before_departure?.penalty_amount &&
        offer.conditions.change_before_departure?.penalty_currency &&
        offer.conditions.change_before_departure.penalty_currency !== currency
      ) {
        const conversion = await convertCurrency(
          offer.conditions.change_before_departure.penalty_amount,
          offer.conditions.change_before_departure.penalty_currency,
          currency
        );

        if (conversion) {
          newConvertedPenalties.change = {
            originalAmount: conversion.originalAmount,
            originalCurrency: conversion.originalCurrency,
            convertedAmount: conversion.convertedAmount,
            convertedCurrency: conversion.convertedCurrency,
            displayText: formatConvertedCurrency(conversion, true),
          };
        } else {
          newConvertedPenalties.change = {
            originalAmount: offer.conditions.change_before_departure.penalty_amount,
            originalCurrency: offer.conditions.change_before_departure.penalty_currency,
            displayText: getFallbackCurrencyDisplay(
              offer.conditions.change_before_departure.penalty_amount,
              offer.conditions.change_before_departure.penalty_currency
            ),
          };
        }
      }

      setConvertedPenalties(newConvertedPenalties);
    };

    convertPenalties();
  }, [offer, currency]);

  // Update expiration info every second for real-time countdown
  useEffect(() => {
    const updateExpiration = () => {
      if (offer.payment_requirements?.price_guarantee_expires_at) {
        const timeInfo = getTimeUntilExpiration(
          offer.payment_requirements.price_guarantee_expires_at
        );
        setExpirationInfo({
          expired: timeInfo.expired,
          formatted: timeInfo.expired
            ? 'Offer expired'
            : formatExpirationTime(offer.payment_requirements.price_guarantee_expires_at),
        });
      }
    };

    updateExpiration();
    const interval = setInterval(updateExpiration, 1000); // Update every second
    return () => clearInterval(interval);
  }, [offer.payment_requirements?.price_guarantee_expires_at]);
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
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

  // Process baggage information for all slices
  const sliceBaggageInfo = processBaggageForAllSlices(offer.slices || []);

  // Removed unused formatDate function - using formatFlightDate from utils instead

  // Legacy baggage processing for backward compatibility
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

  if (!offer) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No offer details available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Price Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {convertedTotalPrice || formatPrice(offer.total_amount, currency)}
            </h2>
            <p className="text-gray-600">Total Price</p>
            {convertedTotalPrice && offer.total_currency !== currency && (
              <p className="text-sm text-gray-500">
                Original: {formatPrice(offer.total_amount, offer.total_currency)}
              </p>
            )}

            {/* Price Guarantee Expiration */}
            {offer.payment_requirements?.price_guarantee_expires_at && (
              <div
                className={`text-sm mt-2 ${expirationInfo.expired ? 'text-red-600' : 'text-orange-600'}`}
              >
                {expirationInfo.expired ? (
                  <div className="flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    Offer expired
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FaClock className="mr-1" />
                    {expirationInfo.formatted}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Operated by</p>
            <div className="flex items-center">
              {offer.owner?.logo_symbol_url && (
                <Image
                  src={offer.owner.logo_symbol_url}
                  alt={offer.owner?.name || 'Airline'}
                  width={32}
                  height={32}
                  className="w-8 h-8 mr-2"
                />
              )}
              <span className="font-medium">{offer.owner?.name || 'Unknown Airline'}</span>
            </div>
          </div>
        </div>

        {/* Raw Details Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowRawDetails(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <FaCode className="w-4 h-4" />
            Show Raw Details
          </button>
        </div>
      </div>

      {/* Itinerary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <FaPlane className="mr-2" />
            Flight Itinerary
          </h3>
          {/* Fare Brand Display */}
          {offer.slices && offer.slices.length > 0 && offer.slices[0].fare_brand_name && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Fare Type</p>
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {offer.slices[0].fare_brand_name}
              </span>
              {offer.slices[0].fare_brand_name === 'Basic Economy' && (
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Restrictive fare with limited flexibility
                </p>
              )}
            </div>
          )}
        </div>

        {Array.isArray(offer.slices) &&
          offer.slices.map((slice, sliceIndex) => (
            <div key={slice.id} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {sliceIndex === 0 ? 'Outbound' : 'Return'} Flight
                  </h4>
                  {slice.segments && slice.segments.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {formatFlightDate(slice.segments[0].departing_at)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Duration: {formatDuration(slice.duration)}
                  </div>
                  {slice.fare_brand_name && (
                    <div className="text-xs text-gray-500 mt-1">{slice.fare_brand_name}</div>
                  )}
                </div>
              </div>

              {Array.isArray(slice.segments) &&
                slice.segments.map((segment, segmentIndex) => (
                  <div key={segment.id}>
                    {/* Segment Details */}
                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {segment.marketing_carrier?.logo_symbol_url && (
                            <Image
                              src={segment.marketing_carrier.logo_symbol_url}
                              alt={segment.marketing_carrier?.name || 'Airline'}
                              width={24}
                              height={24}
                              className="w-6 h-6 mr-2"
                            />
                          )}
                          <span className="font-medium">
                            {segment.marketing_carrier?.name || 'Unknown Airline'}{' '}
                            {segment.marketing_carrier_flight_number || ''}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Aircraft info - only show if available */}
                          {segment.aircraft?.name && (
                            <span className="text-sm text-gray-600">{segment.aircraft.name}</span>
                          )}

                          {/* Amenities icons */}
                          {processAmenities(segment) && (
                            <div className="flex items-center space-x-1">
                              {getAmenitiesIcons(processAmenities(segment)).map((amenity, idx) => (
                                <span
                                  key={idx}
                                  title={amenity.label}
                                  className={`text-sm ${amenity.available ? 'opacity-100' : 'opacity-50'}`}
                                >
                                  {amenity.icon}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Departure */}
                        <div>
                          <div className="text-lg font-semibold">
                            {formatTime(segment.departing_at)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {segment.origin?.name || 'Unknown Airport'} (
                            {segment.origin?.iata_code || 'N/A'})
                          </div>
                          <div className="text-sm text-gray-500">
                            {segment.origin?.city?.name || 'Unknown City'}
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
                          <div className="text-lg font-semibold">
                            {formatTime(segment.arriving_at)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {segment.destination?.name || 'Unknown Airport'} (
                            {segment.destination?.iata_code || 'N/A'})
                          </div>
                          <div className="text-sm text-gray-500">
                            {segment.destination?.city?.name || 'Unknown City'}
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
                              in {segment.destination?.city?.name || 'Unknown City'}
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

        {/* Per-slice baggage information */}
        {sliceBaggageInfo.map((sliceBaggage, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <h4 className="font-medium text-gray-900 mb-3">{sliceBaggage.sliceTitle}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Carry-on Bags</h5>
                {sliceBaggage.baggage.carryOn.length > 0 ? (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {sliceBaggage.baggage.carryOn.map((item, itemIndex) => (
                      <li key={itemIndex}>• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No carry-on bags included</p>
                )}
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Checked Bags</h5>
                {sliceBaggage.baggage.checked.length > 0 ? (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {sliceBaggage.baggage.checked.map((item, itemIndex) => (
                      <li key={itemIndex}>• {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No checked bags included</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Fallback to legacy baggage if no slice baggage available */}
        {sliceBaggageInfo.length === 0 && (
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
        )}
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
                    Fee:{' '}
                    {convertedPenalties.change?.displayText ||
                      formatPrice(
                        offer.conditions.change_before_departure.penalty_amount,
                        offer.conditions.change_before_departure.penalty_currency || currency
                      )}
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
                    Fee:{' '}
                    {convertedPenalties.refund?.displayText ||
                      formatPrice(
                        offer.conditions.refund_before_departure.penalty_amount,
                        offer.conditions.refund_before_departure.penalty_currency || currency
                      )}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No refund information available</p>
            )}
          </div>
        </div>
      </div>

      {/* Expired Offer Notification */}
      {expirationInfo.expired && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="text-red-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Offer Expired</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This flight offer has expired and is no longer available for booking. Please return to
              the search page to find new flight options.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => (window.location.href = '/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raw Details Modal */}
      <RawDetailsModal
        isOpen={showRawDetails}
        onClose={() => setShowRawDetails(false)}
        data={offer}
        title="Flight Offer Raw Details"
      />
    </div>
  );
};

export default OfferDetails;
