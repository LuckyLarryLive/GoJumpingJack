// Date and time formatting utilities for flight displays

/**
 * Format a date string to a human-readable date
 * @param dateString - ISO date string (e.g., "2025-07-01T00:00:00")
 * @returns Formatted date string (e.g., "Tuesday, July 1, 2025")
 */
export function formatFlightDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format a date string to time only
 * @param dateString - ISO date string
 * @returns Time string (e.g., "12:00 AM")
 */
export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Time';
    }

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Invalid Time';
  }
}

/**
 * Calculate time until expiration
 * @param expirationDate - ISO date string
 * @returns Object with time remaining or null if expired
 */
export function getTimeUntilExpiration(expirationDate: string): {
  expired: boolean;
  hours?: number;
  minutes?: number;
  totalMinutes?: number;
  formatted?: string;
} {
  try {
    const expiry = new Date(expirationDate);
    const now = new Date();

    if (isNaN(expiry.getTime())) {
      return { expired: true };
    }

    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { expired: true };
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let formatted = '';
    if (hours > 0) {
      formatted = `${hours}:${minutes.toString().padStart(2, '0')}`;
    } else {
      formatted = `${minutes} min`;
    }

    return {
      expired: false,
      hours,
      minutes,
      totalMinutes,
      formatted,
    };
  } catch {
    return { expired: true };
  }
}

/**
 * Format expiration time for display
 * @param expirationDate - ISO date string
 * @returns Formatted expiration message
 */
export function formatExpirationTime(expirationDate: string): string {
  const timeInfo = getTimeUntilExpiration(expirationDate);

  if (timeInfo.expired) {
    return 'Offer expired';
  }

  if (timeInfo.hours && timeInfo.hours > 0) {
    return `Price guaranteed for ${timeInfo.formatted}`;
  } else {
    return `Price guaranteed for ${timeInfo.minutes} minutes`;
  }
}
