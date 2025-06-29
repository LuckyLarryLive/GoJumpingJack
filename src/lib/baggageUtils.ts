// Baggage utilities for processing flight baggage information

import { DuffelBaggage, DuffelSlice } from '@/types/duffel';

export interface ProcessedBaggage {
  carryOn: string[];
  checked: string[];
}

export interface SliceBaggage {
  sliceIndex: number;
  sliceTitle: string;
  baggage: ProcessedBaggage;
}

/**
 * Process baggage information from a slice's segments
 */
export function processBaggageFromSlice(slice: DuffelSlice): ProcessedBaggage {
  const carryOn: string[] = [];
  const checked: string[] = [];

  // Get baggage from the first segment's first passenger (representative)
  if (slice.segments && slice.segments.length > 0) {
    const firstSegment = slice.segments[0];
    if (firstSegment.passengers && firstSegment.passengers.length > 0) {
      const firstPassenger = firstSegment.passengers[0];
      if (firstPassenger.baggages && Array.isArray(firstPassenger.baggages)) {
        firstPassenger.baggages.forEach((baggage: DuffelBaggage) => {
          const description = formatBaggageDescription(baggage);

          if (baggage.type === 'carry_on') {
            carryOn.push(description);
          } else if (baggage.type === 'checked') {
            checked.push(description);
          }
        });
      }
    }
  }

  return { carryOn, checked };
}

/**
 * Format individual baggage description
 */
function formatBaggageDescription(baggage: DuffelBaggage): string {
  const quantity = baggage.quantity || 0;
  const type = baggage.type.replace('_', '-');

  if (quantity === 0) {
    return `No ${type} bags included`;
  }

  let description = `${quantity} ${type} bag${quantity > 1 ? 's' : ''} included`;

  // Add weight information if available
  if (baggage.weight_value && baggage.weight_unit) {
    description += ` (${baggage.weight_value}${baggage.weight_unit} each)`;
  }

  return description;
}

/**
 * Process baggage for all slices in an offer
 */
export function processBaggageForAllSlices(slices: DuffelSlice[]): SliceBaggage[] {
  return slices.map((slice, index) => ({
    sliceIndex: index,
    sliceTitle: index === 0 ? 'Outbound Flight' : 'Return Flight',
    baggage: processBaggageFromSlice(slice),
  }));
}
