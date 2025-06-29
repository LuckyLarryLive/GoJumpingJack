// Amenities utilities for processing cabin amenities

import { DuffelSegment } from '@/types/duffel';

export interface ProcessedAmenities {
  wifi: {
    available: boolean;
    cost: 'free' | 'paid' | 'unknown';
    icon: string;
    label: string;
  };
  power: {
    available: boolean;
    icon: string;
    label: string;
  };
  seat: {
    pitch?: string;
    legroom?: string;
    type?: string;
    icon: string;
    label: string;
  };
}

/**
 * Process amenities from a flight segment
 */
export function processAmenities(segment: DuffelSegment): ProcessedAmenities {
  const defaultAmenities: ProcessedAmenities = {
    wifi: {
      available: false,
      cost: 'unknown',
      icon: '📶',
      label: 'WiFi not available',
    },
    power: {
      available: false,
      icon: '🔌',
      label: 'Power not available',
    },
    seat: {
      icon: '💺',
      label: 'Seat information not available',
    },
  };

  // Get amenities from first passenger (representative)
  if (!segment.passengers || segment.passengers.length === 0) {
    return defaultAmenities;
  }

  const firstPassenger = segment.passengers[0];
  if (!firstPassenger.cabin || !firstPassenger.cabin.amenities) {
    return defaultAmenities;
  }

  const amenities = firstPassenger.cabin.amenities;
  const processed: ProcessedAmenities = { ...defaultAmenities };

  // Process WiFi
  if (amenities.wifi) {
    processed.wifi = {
      available: amenities.wifi.available || false,
      cost: amenities.wifi.cost || 'unknown',
      icon: amenities.wifi.available ? '📶' : '📵',
      label: amenities.wifi.available
        ? `WiFi ${amenities.wifi.cost === 'paid' ? '($)' : amenities.wifi.cost === 'free' ? '(Free)' : ''}`
        : 'WiFi not available',
    };
  }

  // Process Power
  if (amenities.power) {
    processed.power = {
      available: amenities.power.available || false,
      icon: amenities.power.available ? '🔌' : '🚫',
      label: amenities.power.available ? 'Power outlet' : 'No power outlet',
    };
  }

  // Process Seat
  if (amenities.seat) {
    const seat = amenities.seat;
    let label = 'Seat';

    if (seat.pitch) {
      label += ` (${seat.pitch}" pitch)`;
    }

    if (seat.legroom && seat.legroom !== 'n/a') {
      label += ` • ${seat.legroom} legroom`;
    }

    if (seat.type) {
      label += ` • ${seat.type}`;
    }

    processed.seat = {
      pitch: seat.pitch,
      legroom: seat.legroom,
      type: seat.type,
      icon: '💺',
      label,
    };
  }

  return processed;
}

/**
 * Get amenities icons for display
 */
export function getAmenitiesIcons(amenities: ProcessedAmenities): Array<{
  icon: string;
  label: string;
  available: boolean;
}> {
  return [
    {
      icon: amenities.wifi.icon,
      label: amenities.wifi.label,
      available: amenities.wifi.available,
    },
    {
      icon: amenities.power.icon,
      label: amenities.power.label,
      available: amenities.power.available,
    },
    {
      icon: amenities.seat.icon,
      label: amenities.seat.label,
      available: true, // Seat info is always relevant
    },
  ];
}
