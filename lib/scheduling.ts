// Scheduling engine for Binda bookings

import type { Booking, Service, TimeSlot, AvailabilityConfig } from './types';

/**
 * Default availability configuration
 */
export const DEFAULT_AVAILABILITY: AvailabilityConfig = {
  start_hour: 9, // 9am
  end_hour: 18, // 6pm
  days_ahead: 14, // Show next 2 weeks
};

/**
 * Generate time slots for a given date
 * @param date - Date to generate slots for
 * @param service - Service details (duration, buffer)
 * @param existingBookings - Already booked slots
 * @param config - Availability configuration
 */
export function generateTimeSlots(
  date: Date,
  service: Service,
  existingBookings: Booking[],
  config: AvailabilityConfig = DEFAULT_AVAILABILITY
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const totalDuration = service.duration + service.buffer_minutes;

  // Start from the beginning of the day
  const currentDate = new Date(date);
  currentDate.setHours(config.start_hour, 0, 0, 0);

  // End time for the day
  const endDate = new Date(date);
  endDate.setHours(config.end_hour, 0, 0, 0);

  // Generate slots every 30 minutes
  while (currentDate < endDate) {
    const slotStart = new Date(currentDate);
    const slotEnd = new Date(currentDate);
    slotEnd.setMinutes(slotEnd.getMinutes() + totalDuration);

    // Check if this slot fits within working hours
    if (slotEnd <= endDate) {
      const available = isSlotAvailable(slotStart, slotEnd, existingBookings);
      
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available,
      });
    }

    // Move to next slot (30-minute intervals)
    currentDate.setMinutes(currentDate.getMinutes() + 30);
  }

  return slots;
}

/**
 * Check if a time slot is available (no conflicts with existing bookings)
 */
export function isSlotAvailable(
  slotStart: Date,
  slotEnd: Date,
  existingBookings: Booking[]
): boolean {
  // If it's in the past, it's not available
  if (slotStart < new Date()) {
    return false;
  }

  // Check for conflicts with existing bookings
  for (const booking of existingBookings) {
    // Skip cancelled bookings
    if (booking.status === 'cancelled') {
      continue;
    }

    const bookingStart = new Date(booking.date_time);
    // We need to calculate booking end based on service duration + buffer
    // For now, we'll assume the booking object has this info or we fetch it
    // This is simplified - in real implementation, we'd need to join with service table
    const bookingEnd = new Date(bookingStart);
    bookingEnd.setMinutes(bookingEnd.getMinutes() + 60); // Default to 60 min

    // Check for overlap
    if (
      (slotStart >= bookingStart && slotStart < bookingEnd) ||
      (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
      (slotStart <= bookingStart && slotEnd >= bookingEnd)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Generate available dates for the next N days
 */
export function getAvailableDates(daysAhead: number = 14): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  return dates;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Check if a ZIP code is in the service area
 */
export function isZipInServiceArea(zip: string, serviceAreas: string[]): boolean {
  if (serviceAreas.length === 0) {
    return true; // No restrictions
  }
  return serviceAreas.includes(zip);
}

/**
 * Validate ZIP code format (US)
 */
export function isValidZipCode(zip: string): boolean {
  // US ZIP code: 5 digits or 5+4 format
  return /^\d{5}(-\d{4})?$/.test(zip);
}

/**
 * Calculate end time based on start time and duration
 */
export function calculateEndTime(startTime: Date | string, durationMinutes: number): Date {
  const start = typeof startTime === 'string' ? new Date(startTime) : new Date(startTime);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);
  return end;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Get relative time string (e.g., "in 2 hours", "tomorrow")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 0) {
    return 'past';
  } else if (diffHours < 1) {
    return 'in less than an hour';
  } else if (diffHours < 24) {
    return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffDays === 1) {
    return 'tomorrow';
  } else if (diffDays < 7) {
    return `in ${diffDays} days`;
  } else {
    return formatDate(d);
  }
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}


