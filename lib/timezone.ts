// Timezone handling utilities

import { 
    // format, 
    parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

// Common US timezones for the MVP
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
] as const;

export type Timezone = typeof COMMON_TIMEZONES[number]['value'];

/**
 * Convert a local time to UTC for storage
 */
export function convertToUTC(
  localDateTime: Date, 
  timezone: string
): Date {
  return fromZonedTime(localDateTime, timezone);
}

/**
 * Convert UTC time to local timezone for display
 */
export function convertFromUTC(
  utcDateTime: Date, 
  timezone: string
): Date {
  return toZonedTime(utcDateTime, timezone);
}

/**
 * Format a date/time in a specific timezone
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  formatString: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, formatString);
}

/**
 * Get the current time in a specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  return toZonedTime(new Date(), timezone);
}

/**
 * Parse a time string (HH:mm) in a specific timezone and return UTC Date
 */
export function parseTimeInTimezone(
  timeString: string, // "09:00"
  date: Date, // The date to use
  timezone: string
): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Create a date in the specified timezone
  const localDateTime = new Date(date);
  localDateTime.setHours(hours, minutes, 0, 0);
  
  // Convert to UTC for storage
  return fromZonedTime(localDateTime, timezone);
}

/**
 * Format a time for display in a specific timezone
 */
export function formatTimeInTimezone(
  date: Date | string,
  timezone: string
): string {
  return formatInTimezone(date, timezone, 'h:mm a');
}

/**
 * Format a date for display in a specific timezone
 */
export function formatDateInTimezone(
  date: Date | string,
  timezone: string
): string {
  return formatInTimezone(date, timezone, 'MMM dd, yyyy');
}

/**
 * Format a date and time for display in a specific timezone
 */
export function formatDateTimeInTimezone(
  date: Date | string,
  timezone: string
): string {
  return formatInTimezone(date, timezone, 'MMM dd, yyyy h:mm a');
}

/**
 * Get timezone offset string (e.g., "EST", "PST")
 */
export function getTimezoneAbbreviation(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName');
    return timeZoneName?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Detect user's timezone from browser
 */
export function detectUserTimezone(): string {
  if (typeof window === 'undefined') {
    return 'America/New_York'; // Default for server-side
  }
  
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'America/New_York'; // Fallback
  }
}

/**
 * Validate if a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get timezone info for display
 */
export function getTimezoneInfo(timezone: string) {
  const abbreviation = getTimezoneAbbreviation(timezone);
  const now = getCurrentTimeInTimezone(timezone);
  const currentTime = formatTimeInTimezone(now, timezone);
  
  return {
    timezone,
    abbreviation,
    currentTime,
    offset: now.getTimezoneOffset() / -60, // Convert to hours
  };
}
